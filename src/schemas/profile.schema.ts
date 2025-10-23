import { z } from 'zod';

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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
