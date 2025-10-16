import { z } from 'zod';

export const createRideSchema = z.object({
    startingAddress: z.string().min(1),
    arrivalAddress: z.string().min(1),
    departureCity: z.string().min(1),
    arrivalCity: z.string().min(1),
    departureDatetime: z.string().datetime(),
    arrivalDatetime: z.string().datetime(),
    price: z.number().positive(),
    availableSeats: z.number().int().positive(),
    vehicleId: z.string().min(1),
});

export const updateRideSchema = createRideSchema.partial();

export type CreateRideDto = z.infer<typeof createRideSchema>;
export type UpdateRideDto = z.infer<typeof updateRideSchema>;

