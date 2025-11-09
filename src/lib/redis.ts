import Redis from 'ioredis';
import { logger } from '../middleware/logger.middleware';

const globalForRedis = global as unknown as { redis: Redis };

// Redis client configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis =
    globalForRedis.redis ||
    new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        enableReadyCheck: true,
        lazyConnect: true,
    });

// Handle Redis connection events
redis.on('connect', () => {
    logger.info('Redis connecting...');
});

redis.on('ready', () => {
    logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

// Connect to Redis (non-blocking)
redis.connect().catch((err) => {
    logger.warn({ err }, 'Failed to connect to Redis - continuing without cache');
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Helper functions for cache keys
export const cacheKey = {
    rides: (query?: string) => `rides:${query || 'all'}`,
    ride: (id: string) => `ride:${id}`,
    profiles: (query?: string) => `profiles:${query || 'all'}`,
    profile: (id: string) => `profile:${id}`,
};

// Helper to generate cache key from query params
export const generateCacheKey = (path: string, query: Record<string, any>): string => {
    const queryString = Object.keys(query)
        .sort()
        .map((key) => `${key}=${query[key]}`)
        .join('&');
    return `${path}:${queryString || 'all'}`;
};

// Helper to invalidate cache patterns
export const invalidateCache = async (pattern: string) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            logger.info({ pattern, count: keys.length }, 'Cache invalidated');
        }
    } catch (error) {
        logger.error({ error, pattern }, 'Failed to invalidate cache');
    }
};
