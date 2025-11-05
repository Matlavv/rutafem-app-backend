import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { Counter } from 'prom-client';

// Prometheus metric to track rate limits
const rateLimitCounter = new Counter({
    name: 'rutafem_rate_limit_hits_total',
    help: 'Total number of rate limit hits',
    labelNames: ['type'],
});

// skip rate limiting (for k6 tests)
const skipRateLimit = (req: Request): boolean => {
    return process.env.DISABLE_RATE_LIMIT === 'true';
};

export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
    message: { success: false, message: 'Too many requests, try again later' },
    standardHeaders: true, // return RateLimit-* headers
    legacyHeaders: false,
    skip: skipRateLimit,
    handler: (req, res) => {
        rateLimitCounter.labels('api').inc();
        res.status(429).json({ success: false, message: 'Too many requests, try again later' });
    },
});

// Rate limiting strict for sensitive routes (auth)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per IP
    message: { success: false, message: 'Too many attempts, try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        rateLimitCounter.labels('auth').inc();
        res.status(429).json({
            success: false,
            message: 'Too many attempts, try again later',
        });
    },
});
