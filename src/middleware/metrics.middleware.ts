import { NextFunction, Request, Response } from 'express';
import { collectDefaultMetrics, Histogram, register } from 'prom-client';

// Collect default metrics (CPU, memory, etc.)
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

export { register };
