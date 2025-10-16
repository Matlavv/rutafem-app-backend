import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
    baseURL: 'http://localhost:3000',
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: {
        enabled: true,
        // minPasswordLength: 8,
        // maxPasswordLength: 128,
    },
    trustedOrigins: ['http://localhost:3000'],
    // cookies: {
    //     secure: process.env.NODE_ENV === "production",
    //     sameSite: "lax",
    //     domain: "localhost",
    //     path: "/",
    // },
    // cookies: {
    //     sessionToken: {
    //         name: `next-auth.session-token`,
    //         options: {
    //             httpOnly: true,
    //             sameSite: "none",
    //             secure: true,
    //             path: "/",
    //         },
    //     },
    // },
});
