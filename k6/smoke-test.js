import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { BASE_URL, ENDPOINTS, SLO } from './config.js';

/**
 * SMOKE TEST
 *
 * Objectif: Vérifier que l'application fonctionne avec une charge minimale
 * Durée: 1 minute
 * VUs: 5 utilisateurs virtuels constants
 *
 * Ce test valide:
 * - Les endpoints critiques répondent
 * - Les temps de réponse sont acceptables
 * - Pas d'erreurs serveur
 */

// Métrique personnalisée pour traquer les erreurs
const errorRate = new Rate('errors');

export const options = {
    // Configuration du test
    vus: 5, // 5 utilisateurs virtuels
    duration: '1m', // pendant 1 minute

    // Thresholds basés sur les SLOs
    thresholds: {
        // 95% des requêtes doivent être < 300ms
        http_req_duration: [`p(95)<${SLO.p95Duration}`],

        // 99% des requêtes doivent être < 500ms
        'http_req_duration{endpoint:rides}': [`p(99)<${SLO.p99Duration}`],

        // Moins de 1% d'erreurs
        http_req_failed: [`rate<${SLO.errorRate}`],

        // Taux d'erreurs custom
        errors: [`rate<${SLO.errorRate}`],
    },

    // Tags pour faciliter l'analyse
    tags: {
        test_type: 'smoke',
    },
};

export default function () {
    // 1. Healthcheck
    let res = http.get(`${BASE_URL}${ENDPOINTS.healthcheck}`, {
        tags: { endpoint: 'healthcheck' },
    });

    check(res, {
        'healthcheck status is 200': (r) => r.status === 200,
        'healthcheck has correct message': (r) => {
            const body = JSON.parse(r.body);
            return body.status === 'ok';
        },
    }) || errorRate.add(1);

    sleep(1);

    // 2. Liste des trajets (endpoint critique)
    res = http.get(`${BASE_URL}${ENDPOINTS.rides}`, {
        tags: { endpoint: 'rides' },
    });

    check(res, {
        'rides status is 200': (r) => r.status === 200,
        'rides returns array': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.success === true && Array.isArray(body.data);
            } catch {
                return false;
            }
        },
    }) || errorRate.add(1);

    sleep(1);
}

export function handleSummary(data) {
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        './k6/results/smoke-test-summary.json': JSON.stringify(data, null, 2),
    };
}

// Helper pour le résumé texte
function textSummary(data, options = {}) {
    const { indent = '', enableColors = false } = options;
    const lines = [];

    lines.push(`${indent}Smoke Test Summary`);
    lines.push(`${indent}==================`);
    lines.push('');

    // Metrics
    const metrics = data.metrics;
    if (metrics.http_reqs) {
        lines.push(`${indent}Total Requests: ${metrics.http_reqs.values.count}`);
    }
    if (metrics.http_req_duration && metrics.http_req_duration.values) {
        const values = metrics.http_req_duration.values;
        lines.push(`${indent}Request Duration:`);
        if (values.avg !== undefined) {
            lines.push(`${indent}  - avg: ${values.avg.toFixed(2)}ms`);
        }
        if (values['p(95)'] !== undefined) {
            lines.push(`${indent}  - p95: ${values['p(95)'].toFixed(2)}ms`);
        }
        if (values['p(99)'] !== undefined) {
            lines.push(`${indent}  - p99: ${values['p(99)'].toFixed(2)}ms`);
        }
    }
    if (metrics.http_req_failed && metrics.http_req_failed.values) {
        const failRate = metrics.http_req_failed.values.rate * 100;
        lines.push(`${indent}Failed Requests: ${failRate.toFixed(2)}%`);
    }

    return lines.join('\n');
}
