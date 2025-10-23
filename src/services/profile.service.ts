import { prisma } from '../lib/prisma';
import { UpdateProfileInput } from '../schemas/profile.schema';

export class ProfileService {
    // Get all profiles
    async findAll() {
        return prisma.profile.findMany({
            select: {
                id: true,
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
                profileImageUrl: true,
                experience: true,
                biography: true,
                favoriteMusic: true,
                birthDate: true,
                isVerified: true,
                isDriverVerified: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        email: true,
                        emailVerified: true,
                    },
                },
            },
        });
    }

    // Get profile by ID
    async findById(id: string) {
        const profile = await prisma.profile.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
                profileImageUrl: true,
                experience: true,
                biography: true,
                favoriteMusic: true,
                birthDate: true,
                isVerified: true,
                isDriverVerified: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        email: true,
                        emailVerified: true,
                    },
                },
            },
        });

        if (!profile) throw new Error('Profile non trouvé');
        return profile;
    }

    // Get profile by userId (for authenticated user)
    async findByUserId(userId: string) {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: {
                id: true,
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
                profileImageUrl: true,
                experience: true,
                biography: true,
                favoriteMusic: true,
                birthDate: true,
                isVerified: true,
                isDriverVerified: true,
                stripeAccountId: true,
                stripeCustomerId: true,
                stripeOnboardingComplete: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        email: true,
                        emailVerified: true,
                    },
                },
            },
        });

        if (!profile) throw new Error('Profile non trouvé');
        return profile;
    }

    // Update profile
    async update(id: string, data: UpdateProfileInput) {
        return prisma.profile.update({
            where: { id },
            data,
            select: {
                id: true,
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phoneNumber: true,
                profileImageUrl: true,
                experience: true,
                biography: true,
                favoriteMusic: true,
                birthDate: true,
                isVerified: true,
                isDriverVerified: true,
                updatedAt: true,
            },
        });
    }

    // Delete profile
    async delete(userId: string) {
        await prisma.user.delete({ where: { id: userId } });
    }
}

export const profileService = new ProfileService();
