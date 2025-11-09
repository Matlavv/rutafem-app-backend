import { z } from 'zod';
import { paginationSchema } from './pagination.schema';

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

// filter for get rides
export const rideFiltersSchema = z.object({
    departureCity: z.string().optional(),
    arrivalCity: z.string().optional(),
    departureDate: z.string().date().optional(), // Format: YYYY-MM-DD
    arrivalDate: z.string().date().optional(),
    maxPrice: z.coerce.number().int().positive().optional(),
    minPrice: z.coerce.number().int().positive().optional(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
    minAvailableSeats: z.coerce.number().int().min(1).optional(),
});

export const getRidesQuerySchema = paginationSchema.merge(rideFiltersSchema);

export type CreateRideDto = z.infer<typeof createRideSchema>;
export type UpdateRideDto = z.infer<typeof updateRideSchema>;
export type RideFilters = z.infer<typeof rideFiltersSchema>;
export type GetRidesQuery = z.infer<typeof getRidesQuerySchema>;
