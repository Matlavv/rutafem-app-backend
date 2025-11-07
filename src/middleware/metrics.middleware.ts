import { Request, Response, NextFunction } from 'express';
import { collectDefaultMetrics, Histogram, register } from 'prom-client';

/**
 * Stockage simple des métriques en mémoire
 * Pour production, utiliser Prometheus + Grafana
 */
interface Metrics {
    requests: {
        total: number;
        byMethod: Record<string, number>;
        byStatus: Record<string, number>;
    };
    responseTimes: number[];
    errors: number;
}

const metrics: Metrics = {
    requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
    },
    responseTimes: [],
    errors: 0,
};

/**
 * Middleware de collecte de métriques basiques
 * Compte les requêtes, temps de réponse, erreurs
 */
export const metricsCollector = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Incrémenter les compteurs
        metrics.requests.total++;
        metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
        metrics.requests.byStatus[res.statusCode] = (metrics.requests.byStatus[res.statusCode] || 0) + 1;

        // Stocker les temps de réponse (garder les 1000 derniers)
        metrics.responseTimes.push(duration);
        if (metrics.responseTimes.length > 1000) {
            metrics.responseTimes.shift();
        }

        // Compter les erreurs (5xx)
        if (res.statusCode >= 500) {
            metrics.errors++;
        }

// collect default metrics (CPU, memory, etc...)
collectDefaultMetrics({ prefix: 'rutafem_' });

// get latence http
const httpRequestDuration = new Histogram({
    name: 'rutafem_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

// middleware to get metrics for http requests
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // seconds
        const route = req.route ? `${req.baseUrl || ''}${req.route.path}` : req.path.split('?')[0];
        httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    });

    next();
};

/**
 * Calcule les percentiles depuis un tableau trié
 */
const calculatePercentile = (sortedArray: number[], percentile: number): number => {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[index];
};

/**
 * Endpoint pour exposer les métriques
 * GET /metrics => JSON avec statistiques
 */
export const metricsEndpoint = (_req: Request, res: Response) => {
    const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
    const sum = sortedTimes.reduce((acc, val) => acc + val, 0);
    const avg = sortedTimes.length > 0 ? sum / sortedTimes.length : 0;

    const stats = {
        requests: {
            total: metrics.requests.total,
            byMethod: metrics.requests.byMethod,
            byStatus: metrics.requests.byStatus,
        },
        responseTimes: {
            count: sortedTimes.length,
            avg: Math.round(avg * 100) / 100,
            p50: calculatePercentile(sortedTimes, 50),
            p95: calculatePercentile(sortedTimes, 95),
            p99: calculatePercentile(sortedTimes, 99),
            min: sortedTimes[0] || 0,
            max: sortedTimes[sortedTimes.length - 1] || 0,
        },
        errors: {
            total: metrics.errors,
            rate: metrics.requests.total > 0
                ? Math.round((metrics.errors / metrics.requests.total) * 10000) / 100
                : 0,
        },
    };

    res.json(stats);
};

/**
 * Reset des métriques (utile pour les tests)
 */
export const resetMetrics = () => {
    metrics.requests.total = 0;
    metrics.requests.byMethod = {};
    metrics.requests.byStatus = {};
    metrics.responseTimes = [];
    metrics.errors = 0;
};

export { register };