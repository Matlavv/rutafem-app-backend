import cors from 'cors';
import express from 'express';
import pino from 'pino';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import rideRoutes from './routes/ride.routes';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://localhost:3000'],
        credentials: true, // allow cookies/sessions
    }),
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.get('/', (req, res) => res.json({ status: 'ok', message: 'RutaFem API' }));
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
