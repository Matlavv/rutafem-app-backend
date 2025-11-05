import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                session: { id: string; expiresAt: Date };
            };
        }
    }
}

// Extract token from Authorization header or cookie
const extractToken = (req: Request): string | null => {
    // Try Bearer token first (mobile/API)
    const authHeader = req.headers.authorization;
    if (authHeader) {
        return authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    }

    // Fallback to cookie (web)
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
        if (match) return match[1];
    }

    return null;
};

// Protect routes (require authentication)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token requis',
            });
        }

        // Query session from DB (with index, very fast)
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        emailVerified: true,
                    },
                },
            },
        });

        // Check if session exists and is valid
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Session invalide',
            });
        }

        if (session.expiresAt < new Date()) {
            return res.status(401).json({
                success: false,
                message: 'Session expirée',
            });
        }

        // Attach user to request
        req.user = {
            id: session.user.id,
            email: session.user.email,
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
            },
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Erreur d'authentification",
        });
    }
};
