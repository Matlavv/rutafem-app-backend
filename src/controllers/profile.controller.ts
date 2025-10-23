import { NextFunction, Request, Response } from 'express';
import { changePasswordSchema } from '../schemas/auth.schema';
import { updateProfileSchema } from '../schemas/profile.schema';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';

export class ProfileController {
    // Get all profiles (public)
    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const profiles = await profileService.findAll();
            res.json({ success: true, data: profiles });
        } catch (error) {
            next(error);
        }
    }

    // Get profile by ID (public)
    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const profile = await profileService.findById(req.params.id);
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    // Get own profile (protected)
    async getProfile(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            const profile = await profileService.findByUserId(req.user.id);
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }

    // Update own profile (protected)
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            const data = updateProfileSchema.parse(req.body);

            // Get profile to find ID
            const currentProfile = await profileService.findByUserId(req.user.id);
            const updatedProfile = await profileService.update(currentProfile.id, data);

            res.json({
                success: true,
                message: 'Profil mis à jour',
                data: updatedProfile,
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete own account (protected)
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            await profileService.delete(req.user.id);
            res.json({ success: true, message: 'Compte supprimé' });
        } catch (error) {
            next(error);
        }
    }

    // Change password (protected)
    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            const data = changePasswordSchema.parse(req.body);
            await authService.changePassword(req.user.id, data);

            res.json({
                success: true,
                message: 'Mot de passe modifié',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const profileController = new ProfileController();
