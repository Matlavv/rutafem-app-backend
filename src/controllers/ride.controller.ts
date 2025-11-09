import { NextFunction, Request, Response } from 'express';
import { createRideSchema, getRidesQuerySchema, updateRideSchema } from '../schemas/ride.schema';
import { profileService } from '../services/profile.service';
import { rideService } from '../services/ride.service';

export class RideController {
    // Create ride (protected - requires auth)
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            const data = createRideSchema.parse(req.body);

            // Get profile from userId
            const profile = await profileService.findByUserId(req.user.id);

            // Create ride with driver link
            const ride = await rideService.create(data, profile.id);

            res.status(201).json({
                success: true,
                message: 'Ride créée avec succès',
                data: ride,
            });
        } catch (error) {
            next(error);
        }
    }

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = getRidesQuerySchema.parse(req.query);
            const result = await rideService.findAll(query);
            res.json({
                success: true,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    totalCount: result.totalCount,
                    totalPages:
                        result.limit === -1 ? 1 : Math.ceil(result.totalCount / result.limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async findById(req: Request, res: Response, next: NextFunction) {
        try {
            const ride = await rideService.findById(req.params.id);
            res.json({ success: true, data: ride });
        } catch (error) {
            next(error);
        }
    }

    // Update ride (protected - only driver)
    async update(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            const data = updateRideSchema.parse(req.body);

            // Get profile from userId
            const profile = await profileService.findByUserId(req.user.id);

            // Update ride (checks if user is driver)
            const ride = await rideService.update(req.params.id, data, profile.id);

            res.json({
                success: true,
                message: 'Ride mise à jour',
                data: ride,
            });
        } catch (error) {
            next(error);
        }
    }

    // Delete ride (protected - only driver)
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Non authentifié' });
            }

            // Get profile from userId
            const profile = await profileService.findByUserId(req.user.id);

            // Delete ride (checks if user is driver)
            await rideService.delete(req.params.id, profile.id);

            res.json({ success: true, message: 'Ride supprimée' });
        } catch (error) {
            next(error);
        }
    }
}

export const rideController = new RideController();
