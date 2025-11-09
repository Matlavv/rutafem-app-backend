import { NextFunction, Request, Response } from 'express';
import { generateCacheKey, redis } from '../lib/redis';
import { logger } from './logger.middleware';

const DEFAULT_TTL = 60; // in seconds

export const cacheMiddleware = (ttl: number = DEFAULT_TTL) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = generateCacheKey(req.path, req.query);

        try {
            // Check cache
            const cached = await redis.get(key);

            if (cached) {
                // Cache hit
                const data = JSON.parse(cached);
                logger.info(
                    {
                        request_id: req.request_id,
                        cache: 'HIT',
                        key,
                        path: req.path,
                        ttl,
                    },
                    'Cache hit - returning cached data',
                );
                return res.json(data);
            }

            // Cache miss - intercept response
            logger.info(
                {
                    request_id: req.request_id,
                    cache: 'MISS',
                    key,
                    path: req.path,
                    ttl,
                },
                'Cache miss - fetching from database',
            );

            const originalJson = res.json.bind(res);
            res.json = function (body: any) {
                // Only cache successful responses (2xx)
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    redis.setex(key, ttl, JSON.stringify(body)).catch((err) => {
                        logger.error(
                            {
                                err,
                                request_id: req.request_id,
                                key,
                            },
                            'Failed to cache response',
                        );
                    });
                    logger.debug(
                        {
                            request_id: req.request_id,
                            cache: 'SET',
                            key,
                            path: req.path,
                            ttl,
                        },
                        'Response cached',
                    );
                }
                return originalJson(body);
            };

            next();
        } catch (error) {
            // If Redis fails, continue without cache
            logger.warn(
                {
                    error,
                    request_id: req.request_id,
                    key,
                    path: req.path,
                },
                'Cache middleware error - continuing without cache',
            );
            next();
        }
    };
};
