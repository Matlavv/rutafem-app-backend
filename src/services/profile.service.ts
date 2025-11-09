import { prisma } from '../lib/prisma';
import { GetProfilesQuery, UpdateProfileInput } from '../schemas/profile.schema';

// select for profile list, get only necessary data
const profileListSelect = {
    id: true,
    userId: true,
    firstname: true,
    lastname: true,
    username: true,
    profileImageUrl: true,
    isVerified: true,
    isDriverVerified: true,
    createdAt: true,
    user: {
        select: {
            email: true,
            emailVerified: true,
        },
    },
};

export class ProfileService {
    // Get all profiles with pagination and filters
    async findAll(query: GetProfilesQuery) {
        const { page, limit, ...filters } = query;
        const skip = limit === -1 ? undefined : (page - 1) * limit;
        const take = limit === -1 ? undefined : limit;

        // add filters with WHERE query
        const where: any = {};
        if (filters.isVerified !== undefined) where.isVerified = filters.isVerified;
        if (filters.isDriverVerified !== undefined)
            where.isDriverVerified = filters.isDriverVerified;
        if (filters.username) where.username = { contains: filters.username, mode: 'insensitive' };

        // parallel queries for data + count
        const [profiles, totalCount] = await Promise.all([
            prisma.profile.findMany({
                where,
                select: profileListSelect,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            limit === -1 ? Promise.resolve(0) : prisma.profile.count({ where }),
        ]);

        return { data: profiles, totalCount, page, limit };
    }

    // Get profile by ID
    async findById(id: string) {
        const profile = await prisma.profile.findUnique({
            where: { id },
            select: {
                ...profileListSelect,
                phoneNumber: true,
                experience: true,
                biography: true,
                favoriteMusic: true,
                birthDate: true,
                updatedAt: true,
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
