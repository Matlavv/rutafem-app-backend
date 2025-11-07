import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Only enable in development/test environment
if (process.env.NODE_ENV !== 'production') {
    // Trigger a 400 Bad Request
    router.get('/error/400', (req, res) => {
        res.status(400).json({
            success: false,
            message: 'Bad Request - Test error',
        });
    });

    // Trigger a 404 Not Found
    router.get('/error/404', (req, res) => {
        res.status(404).json({
            success: false,
            message: 'Resource not found - Test error',
        });
    });

    // Trigger a 500 Internal Server Error
    router.get('/error/500', (req, res) => {
        res.status(500).json({
            success: false,
            message: 'Internal server error - Test error',
        });
    });

    // Trigger an unhandled exception (caught by errorHandler)
    router.get('/error/exception', (req, res, next) => {
        const error = new Error('Unhandled exception - Test error');
        next(error);
    });

    // Trigger a Zod validation error
    router.post('/error/validation', (req, res, next) => {
        const schema = z.object({
            name: z.string().min(1),
            age: z.number().min(18),
        });

        try {
            schema.parse(req.body);
            res.json({ success: true, message: 'Validation passed' });
        } catch (error) {
            next(error);
        }
    });

    // Trigger a database error (simulated)
    router.get('/error/database', (req, res, next) => {
        const error = new Error('Database connection failed - Test error');
        error.name = 'DatabaseError';
        next(error);
    });

    // Trigger a slow request (>500ms) without error
    router.get('/slow', async (req, res) => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        res.json({
            success: true,
            message: 'Slow request completed',
            duration: '800ms',
        });
    });

    // Trigger multiple errors in sequence
    router.get('/error/batch', async (req, res) => {
        const errors = [];

        // Simulate 5 failed operations
        for (let i = 0; i < 5; i++) {
            errors.push({
                operation: `Operation ${i + 1}`,
                status: 'failed',
                error: `Test error ${i + 1}`,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Multiple operations failed',
            errors,
        });
    });

    // Get test routes info
    router.get('/info', (req, res) => {
        res.json({
            success: true,
            message: 'Test routes available',
            routes: [
                { path: '/api/test/error/400', description: 'Trigger 400 Bad Request' },
                { path: '/api/test/error/404', description: 'Trigger 404 Not Found' },
                { path: '/api/test/error/500', description: 'Trigger 500 Internal Server Error' },
                { path: '/api/test/error/exception', description: 'Trigger unhandled exception' },
                {
                    path: '/api/test/error/validation',
                    method: 'POST',
                    description: 'Trigger Zod validation error',
                },
                { path: '/api/test/error/database', description: 'Trigger database error' },
                { path: '/api/test/error/batch', description: 'Trigger multiple errors' },
                { path: '/api/test/slow', description: 'Trigger slow request (800ms)' },
            ],
        });
    });
}

export default router;
