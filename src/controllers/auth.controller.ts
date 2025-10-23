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
            await auth.api.signOut({
                headers: req.headers as never,
            });

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
            const session = await authService.getSession(req.headers as never);

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'Aucune session active',
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
