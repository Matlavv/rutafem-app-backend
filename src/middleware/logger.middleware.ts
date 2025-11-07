import { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import { randomUUID } from 'crypto';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

/**
 * Middleware de logging pour tracer toutes les requêtes HTTP
 * Capture: méthode, URL, durée, status code
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log au début de la requête
    logger.info({
        method: req.method,
        url: req.url,
        ip: req.ip,
    }, 'Incoming request');

    // Hook sur la fin de la réponse
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
        };

        if (res.statusCode >= 500) {
            logger.error(logData, 'Request completed with error');
        } else if (res.statusCode >= 400) {
            logger.warn(logData, 'Request completed with client error');
        } else {
            logger.info(logData, 'Request completed');
        }


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

export { logger };

