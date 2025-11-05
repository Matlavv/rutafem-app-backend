import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

// session tokens for mobile & web
export const auth = betterAuth({
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true, // Auto-login after register
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // Update session if > 24h
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache cookie 5 minutes
        },
    },
    trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://localhost:3000'],
    advanced: {
        database: {
            generateId: () => crypto.randomUUID(),
        },
    },
});
