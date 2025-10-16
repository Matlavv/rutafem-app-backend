import express from 'express';
import pino from 'pino';
import { prisma } from './lib/prisma';


// Configuration du logger Pino
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false
        }
    } : undefined
});

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(3000, () => {
    logger.info(`Server is running on port ${3000}`);
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
    logger.info(`Server is running on port ${3000}`);


    app.listen(3000, () => {
        logger.info(`🚀 Server is running on port ${3000}`);
    });
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});