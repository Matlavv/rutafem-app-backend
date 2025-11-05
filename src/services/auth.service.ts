import { auth } from '../lib/auth';
import { prisma } from '../lib/prisma';
import { ChangePasswordInput, RegisterInput } from '../schemas/auth.schema';

export class AuthService {
    // Register: create User (auth) + Profile (user data)
    async register(data: RegisterInput) {
        const { email, password, firstname, lastname, username, phoneNumber, birthDate } = data;

        // Check if email or username already exists
        const [existingUser, existingProfile] = await Promise.all([
            prisma.user.findUnique({ where: { email } }),
            prisma.profile.findUnique({ where: { username } }),
        ]);

        if (existingUser) throw new Error('Email déjà utilisé');
        if (existingProfile) throw new Error("Nom d'utilisateur déjà pris");

        // 1. Better-Auth creates User + Account
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: `${firstname} ${lastname}`,
            },
        });

        // 2. Create Profile
        const profile = await prisma.profile.create({
            data: {
                userId: result.user.id,
                firstname,
                lastname,
                username,
                phoneNumber,
                birthDate: new Date(birthDate),
            },
        });

        return {
            user: result.user,
            profile,
            token: result.token,
        };
    }

    // Get session by token
    async getSessionByToken(token: string) {
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        emailVerified: true,
                    },
                },
            },
        });

        if (!session || session.expiresAt < new Date()) {
            return null;
        }

        return {
            user: session.user,
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
                token: session.token,
            },
        };
    }

    // Logout: delete session from DB
    async logout(token: string) {
        await prisma.session.delete({
            where: { token },
        });
    }

    // Change password
    async changePassword(userId: string, data: ChangePasswordInput) {
        await auth.api.changePassword({
            body: {
                newPassword: data.newPassword,
                currentPassword: data.currentPassword,
            },
            headers: new Headers(),
        });
    }
}

export const authService = new AuthService();
