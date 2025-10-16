import express from 'express';
import pino from 'pino';
import { prisma } from './lib/prisma';
import rideRoutes from './routes/ride.routes';
import { errorHandler } from './middleware/errorHandler';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => res.json({ status: 'ok', message: 'RutaFem API' }));
app.use('/api/rides', rideRoutes);

// Error handler
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