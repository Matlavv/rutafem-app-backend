import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import { logger, requestLogger } from './middleware/logger.middleware';
import { metricsCollector, metricsEndpoint } from './middleware/metrics.middleware';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import rideRoutes from './routes/ride.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://localhost:3000'],
        credentials: true, // allow cookies/sessions
    }),
);

// Middleware d'instrumentation
app.use(requestLogger);
app.use(metricsCollector);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'RutaFem API Docs',
    }),
);
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Routes API
app.get('/', (req, res) => res.json({ status: 'ok', message: 'RutaFem API' }));
app.get('/metrics', metricsEndpoint);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/rides', rideRoutes);

app.use(errorHandler);

// Database connection check
async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.info('✅ Database connected');
    } catch (error) {
        logger.error({ error }, 'Database connection failed');
        process.exit(1);
    }
}

// Start server
checkDatabaseConnection().then(() => {
    app.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});
