import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

declare global {
    namespace Express {
        interface Request {
            request_id?: string;
        }
    }
}

// add request_id to each request and log it
export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    req.request_id = randomUUID();
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const fullPath = req.originalUrl.split('?')[0];

        // skip logging /metrics endpoint
        if (fullPath === '/metrics') {
            return;
        }

        // log request completion
        logger.info(
            {
                request_id: req.request_id,
                method: req.method,
                path: fullPath,
                status_code: res.statusCode,
                duration_ms: duration,
            },
            'Request completed',
        );
    });

    next();
};
