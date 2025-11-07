import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, ENDPOINTS, SLO } from './config.js';

/**
 * STRESS TEST
 *
 * Objectif: Identifier les limites du système et les goulots d'étranglement
 * Durée: ~5 minutes
 *
 * Scénario par étapes:
 * 1. Ramp-up: 0 -> 50 VUs en 1min (montée progressive)
 * 2. Plateau: 50 VUs pendant 2min (charge soutenue)
 * 3. Spike: 50 -> 100 VUs en 30s (pic de charge)
 * 4. Peak: 100 VUs pendant 1min (charge maximale)
 * 5. Ramp-down: 100 -> 0 VUs en 30s (descente)
 */

// Métriques personnalisées
const errorRate = new Rate('errors');
const ridesLatency = new Trend('rides_latency');

export const options = {
    // Test par étapes
    stages: [
        { duration: '1m', target: 50 }, // Montée progressive
        { duration: '2m', target: 50 }, // Charge soutenue
        { duration: '30s', target: 100 }, // Pic rapide
        { duration: '1m', target: 100 }, // Charge max
        { duration: '30s', target: 0 }, // Descente
    ],

    // Thresholds basés sur les SLOs
    thresholds: {
        // Temps de réponse p95 < 300ms
        http_req_duration: [`p(95)<${SLO.p95Duration}`],

        // Temps de réponse p99 < 500ms pour l'endpoint rides
        'http_req_duration{endpoint:rides}': [`p(99)<${SLO.p99Duration}`],

        // Moins de 1% d'échecs
        http_req_failed: [`rate<${SLO.errorRate}`],

        // Taux d'erreurs < 1%
        errors: [`rate<${SLO.errorRate}`],

        // 95% des requêtes rides < 300ms
        rides_latency: [`p(95)<${SLO.p95Duration}`],
    },

    tags: {
        test_type: 'stress',
    },
};

export default function () {
    // Scénario réaliste: 70% reads, 30% healthcheck
    const randomValue = Math.random();

    if (randomValue < 0.7) {
        // 70% - Consulter la liste des trajets (endpoint critique)
        const res = http.get(`${BASE_URL}${ENDPOINTS.rides}`, {
            tags: { endpoint: 'rides' },
        });

        const isSuccess = check(res, {
            'rides status is 200': (r) => r.status === 200,
            'rides response time < 500ms': (r) => r.timings.duration < 500,
            'rides returns valid data': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.success === true && Array.isArray(body.data);
                } catch {
                    return false;
                }
            },
        });

        if (!isSuccess) {
            errorRate.add(1);
        }

        // Tracker la latence de l'endpoint critique
        ridesLatency.add(res.timings.duration);
    } else {
        // 30% - Healthcheck
        const res = http.get(`${BASE_URL}${ENDPOINTS.healthcheck}`, {
            tags: { endpoint: 'healthcheck' },
        });

        check(res, {
            'healthcheck status is 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    }

    // Pause entre les requêtes (simule un utilisateur réel)
    sleep(1);
}

export function handleSummary(data) {
    const summary = generateDetailedSummary(data);

    return {
        stdout: summary.text,
        '/results/stress-test-summary.json': JSON.stringify(data, null, 2),
        '/results/stress-test-report.txt': summary.report,
    };
}

function generateDetailedSummary(data) {
    const lines = [];
    lines.push('=====================================');
    lines.push('    STRESS TEST - RAPPORT DÉTAILLÉ   ');
    lines.push('=====================================\n');

    const metrics = data.metrics;

    // Vue d'ensemble
    lines.push("📊 VUE D'ENSEMBLE");
    lines.push('─────────────────');
    if (metrics.vus) {
        lines.push(`VUs max: ${metrics.vus.values.max}`);
    }
    if (metrics.http_reqs) {
        lines.push(`Total requêtes: ${metrics.http_reqs.values.count}`);
        const rps = metrics.http_reqs.values.rate;
        lines.push(`RPS moyen: ${rps.toFixed(2)}`);
    }
    lines.push('');

    // Temps de réponse
    lines.push('⏱️  TEMPS DE RÉPONSE');
    lines.push('─────────────────────');
    if (metrics.http_req_duration && metrics.http_req_duration.values) {
        const duration = metrics.http_req_duration.values;
        if (duration.min !== undefined) lines.push(`Min: ${duration.min.toFixed(2)}ms`);
        if (duration.avg !== undefined) lines.push(`Avg: ${duration.avg.toFixed(2)}ms`);
        if (duration.med !== undefined) lines.push(`Med: ${duration.med.toFixed(2)}ms`);
        if (duration['p(90)'] !== undefined) lines.push(`p90: ${duration['p(90)'].toFixed(2)}ms`);
        if (duration['p(95)'] !== undefined) {
            lines.push(
                `p95: ${duration['p(95)'].toFixed(2)}ms ${
                    duration['p(95)'] > SLO.p95Duration ? '❌ SLO dépassé' : '✅'
                }`,
            );
        }
        if (duration['p(99)'] !== undefined) {
            lines.push(
                `p99: ${duration['p(99)'].toFixed(2)}ms ${
                    duration['p(99)'] > SLO.p99Duration ? '❌ SLO dépassé' : '✅'
                }`,
            );
        }
        if (duration.max !== undefined) lines.push(`Max: ${duration.max.toFixed(2)}ms`);
    }
    lines.push('');

    // Endpoint rides
    if (metrics.rides_latency && metrics.rides_latency.values) {
        lines.push('🚗 ENDPOINT /api/rides (CRITIQUE)');
        lines.push('───────────────────────────────────');
        const ridesLatency = metrics.rides_latency.values;
        if (ridesLatency.avg !== undefined) {
            lines.push(`Avg: ${ridesLatency.avg.toFixed(2)}ms`);
        }
        if (ridesLatency['p(95)'] !== undefined) {
            lines.push(
                `p95: ${ridesLatency['p(95)'].toFixed(2)}ms ${
                    ridesLatency['p(95)'] > SLO.p95Duration ? '❌' : '✅'
                }`,
            );
        }
        if (ridesLatency['p(99)'] !== undefined) {
            lines.push(
                `p99: ${ridesLatency['p(99)'].toFixed(2)}ms ${
                    ridesLatency['p(99)'] > SLO.p99Duration ? '❌' : '✅'
                }`,
            );
        }
        lines.push('');
    }

    // Erreurs
    lines.push('❗ ERREURS');
    lines.push('──────────');
    if (metrics.http_req_failed) {
        const failRate = metrics.http_req_failed.values.rate * 100;
        const status = failRate < SLO.errorRate * 100 ? '✅' : '❌';
        lines.push(`Taux d'échec: ${failRate.toFixed(2)}% ${status}`);
        lines.push(`Requêtes échouées: ${metrics.http_req_failed.values.fails || 0}`);
    }
    if (metrics.errors) {
        const errRate = metrics.errors.values.rate * 100;
        lines.push(`Taux d'erreur: ${errRate.toFixed(2)}%`);
    }
    lines.push('');

    // Recommandations
    lines.push('💡 RECOMMANDATIONS');
    lines.push('───────────────────');

    const issues = [];
    if (metrics.http_req_duration?.values['p(95)'] > SLO.p95Duration) {
        issues.push('⚠️  P95 dépasse le SLO - Investiguer les temps de réponse');
    }
    if (metrics.http_req_failed?.values.rate > SLO.errorRate) {
        issues.push("⚠️  Taux d'erreur élevé - Vérifier les logs");
    }
    if (metrics.http_req_duration?.values.max > 2000) {
        issues.push('⚠️  Pic de latence détecté (>2s) - Vérifier DB/cache');
    }

    if (issues.length === 0) {
        lines.push('✅ Tous les SLOs sont respectés !');
    } else {
        issues.forEach((issue) => lines.push(issue));
    }

    lines.push('');
    lines.push('=====================================\n');

    const report = lines.join('\n');

    return {
        text: report,
        report: report,
    };
}
