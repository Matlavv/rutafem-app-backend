import { z } from 'zod';
import { paginationSchema } from './pagination.schema';

export const updateProfileSchema = z.object({
    firstname: z.string().min(1).max(100).optional(),
    lastname: z.string().min(1).max(100).optional(),
    username: z.string().min(3).max(50).optional(),
    phoneNumber: z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/)
        .optional(),
    profileImageUrl: z.url().optional(),
    experience: z.string().max(500).optional(),
    biography: z.string().max(1000).optional(),
    favoriteMusic: z.string().max(200).optional(),
    birthDate: z.string().datetime().or(z.date()).optional(),
    isVerified: z.boolean().optional(),
    isDriverVerified: z.boolean().optional(),
});

// filter for get profiles
export const profileFiltersSchema = z.object({
    isVerified: z.coerce.boolean().optional(),
    isDriverVerified: z.coerce.boolean().optional(),
    username: z.string().optional(), // Recherche partielle
});

export const getProfilesQuerySchema = paginationSchema.merge(profileFiltersSchema);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ProfileFilters = z.infer<typeof profileFiltersSchema>;
export type GetProfilesQuery = z.infer<typeof getProfilesQuerySchema>;
