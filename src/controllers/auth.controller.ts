import { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export class AuthController {
    // register user
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const data = registerSchema.parse(req.body);
            const result = await authService.register(data);

            res.status(201).json({
                success: true,
                message: 'Compte créé avec succès',
                data: result,
            });
        } catch (error) {
            next(error);
            console.log(error);

        }
    }

    // login user
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = loginSchema.parse(req.body);

            const result = await auth.api.signInEmail({
                body: { email, password },
            });

            res.json({
                success: true,
                message: 'Connexion réussie',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    // logout
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // Extract token from Authorization header or cookie
            const authHeader = req.headers.authorization;
            let token: string | null = null;

            if (authHeader) {
                token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            } else {
                // Try cookie
                const cookieHeader = req.headers.cookie;
                if (cookieHeader) {
                    const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
                    if (match) token = match[1];
                }
            }

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token requis pour se déconnecter',
                });
            }

            // Delete session from DB
            await authService.logout(token);

            res.json({
                success: true,
                message: 'Déconnexion réussie',
            });
        } catch (error) {
            next(error);
        }
    }

    // current session
    async getSession(req: Request, res: Response, next: NextFunction) {
        try {
            // Extract token from Authorization header or cookie
            const authHeader = req.headers.authorization;
            let token: string | null = null;

            if (authHeader) {
                token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
            } else {
                // Try cookie
                const cookieHeader = req.headers.cookie;
                if (cookieHeader) {
                    const match = cookieHeader.match(/better-auth\.session_token=([^;]+)/);
                    if (match) token = match[1];
                }
            }

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token requis',
                });
            }

            // Get session from DB
            const session = await authService.getSessionByToken(token);

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Session invalide ou expirée',
                });
            }

            res.json({
                success: true,
                data: session,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
