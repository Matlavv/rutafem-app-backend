import express from 'express';
import pino from 'pino';
import { prisma } from './lib/prisma';


// Configuration du logger Pino
const logger = pino({
    level: process.env.LOG_LEVEL || 'info'
});

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World');
});

// check database connection
async function checkDatabaseConnection() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        logger.info('✅ Database connection established successfully');
    } catch (error) {
        logger.error({
            error,
            action: 'checkDatabaseConnection',
            details: 'Database connection failed',
        }, 'Database connection failed');
        process.exit(1);
    }
}

// start server with database connection check
checkDatabaseConnection().then(async () => {
    app.listen(PORT, () => {
        logger.info(`🚀 Server is running on port ${PORT}`);
    });
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});