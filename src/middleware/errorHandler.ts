import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../prisma/generated/prisma';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error({ error: err, path: req.path, method: req.method }, 'Request error');

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.issues,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }
        if (err.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Resource already exists' });
        }
    }

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
};

