import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { BASE_URL, ENDPOINTS, SLO } from './config.js';

/**
 * SMOKE TEST
 *
 * Objective: Verify that the application works with minimal load
 * Duration: 1 minute
 * VUs: 5 users
 *
 * This test validates:
 * - Critical endpoints respond
 * - Response times are acceptable
 * - No server errors
 */

const errorRate = new Rate('errors');

export const options = {
    vus: 5, // 5 users
    duration: '1m', // for 1 minute

    thresholds: {
        // 95% of requests should be < 300ms
        http_req_duration: [`p(95)<${SLO.p95Duration}`],

        // 99% of requests should be < 500ms
        'http_req_duration{endpoint:rides}': [`p(99)<${SLO.p99Duration}`],

        // Less than 1% of errors
        http_req_failed: [`rate<${SLO.errorRate}`],

        // Custom error rate
        errors: [`rate<${SLO.errorRate}`],
    },

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
            try {
                const body = JSON.parse(r.body);
                return body.status === 'ok';
            } catch {
                return false;
            }
        },
    });

    if (res.status >= 500 || res.error) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(1);

    // 2. Rides endpoint
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
    });

    // Only count real errors (5xx, timeouts)
    if (res.status >= 500 || res.error) {
        errorRate.add(1);
    } else {
        errorRate.add(0);
    }

    sleep(1);
}

export function handleSummary(data) {
    return {
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
        '/results/smoke-test-summary.json': JSON.stringify(data, null, 2),
    };
}

function textSummary(data, options = {}) {
    const { indent = '', enableColors = false } = options;
    const lines = [];

    lines.push(`${indent}Smoke Test Summary`);
    lines.push(`${indent}==================`);
    lines.push('');

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
