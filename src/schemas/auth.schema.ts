import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email('Email invalide'),
    password: z.string().min(8, 'Mot de passe minimum 8 caractères'),
});

export const registerSchema = z.object({
    email: z.email('Email invalide'),
    password: z
        .string()
        .min(8, 'Mot de passe minimum 8 caractères')
        .max(128, 'Mot de passe maximum 128 caractères')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Mot de passe invalide',
        ),
    firstname: z.string().min(1, 'Prénom requis').max(100),
    lastname: z.string().min(1, 'Nom requis').max(100),
    username: z.string().min(3, "Nom d'utilisateur minimum 3 caractères").max(50),
    phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide'),
    birthDate: z.string().datetime().or(z.date()),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
