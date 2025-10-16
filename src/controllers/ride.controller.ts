import { Request, Response, NextFunction } from 'express';
import { rideService } from '../services/ride.service';
import { createRideSchema, updateRideSchema } from '../schemas/ride.schema';
import { ZodError } from 'zod';

export class RideController {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const data = createRideSchema.parse(req.body);
            const ride = await rideService.create(data);
            res.status(201).json({ success: true, data: ride });
        } catch (error) {
            next(error);
        }
    }

    async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const rides = await rideService.findAll();
            res.json({ success: true, data: rides });
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

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const data = updateRideSchema.parse(req.body);
            const ride = await rideService.update(req.params.id, data);
            res.json({ success: true, data: ride });
        } catch (error) {
            next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            await rideService.delete(req.params.id);
            res.json({ success: true, message: 'Ride deleted' });
        } catch (error) {
            next(error);
        }
    }
}

export const rideController = new RideController();

