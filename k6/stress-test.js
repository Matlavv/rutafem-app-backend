import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, ENDPOINTS, SLO } from './config.js';

/**
 * STRESS TEST
 *
 * Objective: Identify system limits and bottlenecks
 * Duration: ~5 minutes
 *
 * Step-by-step scenario:
 * 1. Ramp-up: 0 -> 50 VUs in 1min (progressive ramp-up)
 * 2. Plateau: 50 VUs for 2min (sustained load)
 * 3. Spike: 50 -> 100 VUs in 30s (quick spike)
 * 4. Peak: 100 VUs for 1min (maximum load)
 * 5. Ramp-down: 100 -> 0 VUs in 30s (ramp-down)
 */

const errorRate = new Rate('errors');
const ridesLatency = new Trend('rides_latency');

export const options = {
    stages: [
        { duration: '1m', target: 50 }, // Progressive ramp-up
        { duration: '2m', target: 50 }, // Sustained load
        { duration: '30s', target: 100 }, // Quick spike
        { duration: '1m', target: 100 }, // Maximum load
        { duration: '30s', target: 0 }, // Ramp-down
    ],

    thresholds: {
        // p95 response time < 300ms
        http_req_duration: [`p(95)<${SLO.p95Duration}`],

        // p99 response time < 500ms for the rides endpoint
        'http_req_duration{endpoint:rides}': [`p(99)<${SLO.p99Duration}`],

        // Less than 1% of failures
        http_req_failed: [`rate<${SLO.errorRate}`],

        // Error rate < 1%
        errors: [`rate<${SLO.errorRate}`],

        // 95% of rides requests < 300ms
        rides_latency: [`p(95)<${SLO.p95Duration}`],
    },

    tags: {
        test_type: 'stress',
    },
};

export default function () {
    // Realistic scenario: 70% reads, 30% healthcheck
    const randomValue = Math.random();

    if (randomValue < 0.7) {
        // 70% - Read the list of rides (critical endpoint)
        const res = http.get(`${BASE_URL}${ENDPOINTS.rides}`, {
            tags: { endpoint: 'rides' },
        });

        // Quality checks (SLO)
        check(res, {
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

        // Only count real errors (5xx, timeouts, etc.)
        if (res.status >= 500 || res.error) {
            errorRate.add(1);
        } else {
            errorRate.add(0);
        }

        // Track the latency of the critical endpoint
        ridesLatency.add(res.timings.duration);
    } else {
        // 30% - Healthcheck
        const res = http.get(`${BASE_URL}${ENDPOINTS.healthcheck}`, {
            tags: { endpoint: 'healthcheck' },
        });

        check(res, {
            'healthcheck status is 200': (r) => r.status === 200,
        });

        // Only count real errors (5xx, timeouts, etc.)
        if (res.status >= 500 || res.error) {
            errorRate.add(1);
        } else {
            errorRate.add(0);
        }
    }

    // Pause between requests (simulate a real user)
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

    // Errors
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

    // Recommendations
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
