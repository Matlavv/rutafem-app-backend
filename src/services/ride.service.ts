import pino from 'pino';
import { prisma } from '../lib/prisma';
import { cacheKey, invalidateCache, redis } from '../lib/redis';
import { CreateRideDto, GetRidesQuery, UpdateRideDto } from '../schemas/ride.schema';

const logger = pino({ level: 'info' });

// select for ride list, get only necessary data
const rideListSelect = {
    id: true,
    startingAddress: true,
    arrivalAddress: true,
    departureCity: true,
    arrivalCity: true,
    departureDatetime: true,
    arrivalDatetime: true,
    price: true,
    status: true,
    availableSeats: true,
    vehicleId: true,
    createdAt: true,
    participants: {
        select: {
            id: true,
            driver: true,
            profile: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    username: true,
                    profileImageUrl: true,
                },
            },
        },
    },
};

export class RideService {
    // Create ride with driver (via profileId)
    async create(data: CreateRideDto, profileId: string) {
        try {
            const ride = await prisma.ride.create({
                data: {
                    ...data,
                    departureDatetime: new Date(data.departureDatetime),
                    arrivalDatetime: new Date(data.arrivalDatetime),
                    status: 'pending',
                    participants: {
                        create: {
                            profileId,
                            driver: true,
                        },
                    },
                },
                select: rideListSelect,
            });
            logger.info({ rideId: ride.id, profileId }, 'Ride created with driver');

            // Invalidate cache for rides list
            await invalidateCache('rides:*').catch((err) => {
                logger.warn({ err }, 'Failed to invalidate cache after ride creation');
            });

            return ride;
        } catch (error) {
            logger.error({ error }, 'Failed to create ride');
            throw error;
        }
    }

    async findAll(query: GetRidesQuery) {
        try {
            const { page, limit, ...filters } = query;
            const skip = limit === -1 ? undefined : (page - 1) * limit;
            const take = limit === -1 ? undefined : limit;

            // add filters with WHERE query
            const where: any = {};
            if (filters.departureCity) where.departureCity = filters.departureCity;
            if (filters.arrivalCity) where.arrivalCity = filters.arrivalCity;
            if (filters.status) where.status = filters.status;
            if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
            if (filters.minPrice) where.price = { ...where.price, gte: filters.minPrice };
            if (filters.minAvailableSeats)
                where.availableSeats = { gte: filters.minAvailableSeats };

            // add filters for dates (without time)
            if (filters.departureDate) {
                const startDate = new Date(filters.departureDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(filters.departureDate);
                endDate.setHours(23, 59, 59, 999);
                where.departureDatetime = { gte: startDate, lte: endDate };
            }
            if (filters.arrivalDate) {
                const startDate = new Date(filters.arrivalDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(filters.arrivalDate);
                endDate.setHours(23, 59, 59, 999);
                where.arrivalDatetime = { gte: startDate, lte: endDate };
            }

            // parallel queries for data + count
            const [rides, totalCount] = await Promise.all([
                prisma.ride.findMany({
                    where,
                    select: rideListSelect,
                    orderBy: { departureDatetime: 'asc' },
                    skip,
                    take,
                }),
                limit === -1 ? Promise.resolve(0) : prisma.ride.count({ where }),
            ]);

            logger.info({ count: rides.length, totalCount, filters }, 'Rides fetched');
            return { data: rides, totalCount, page, limit };
        } catch (error) {
            logger.error({ error }, 'Failed to fetch rides');
            throw error;
        }
    }

    async findById(id: string) {
        try {
            const ride = await prisma.ride.findUnique({
                where: { id },
                select: {
                    ...rideListSelect,
                    updatedAt: true,
                },
            });
            if (!ride) throw new Error('Ride not found');
            logger.info({ rideId: id }, 'Ride fetched');
            return ride;
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to fetch ride');
            throw error;
        }
    }

    // Update ride (only by driver)
    async update(id: string, data: UpdateRideDto, profileId: string) {
        try {
            // Check if user is the driver
            const userRide = await prisma.userRide.findFirst({
                where: { rideId: id, profileId, driver: true },
            });

            if (!userRide) throw new Error('Seul le conducteur peut modifier cette ride');

            const ride = await prisma.ride.update({
                where: { id },
                data: {
                    ...data,
                    ...(data.departureDatetime && {
                        departureDatetime: new Date(data.departureDatetime),
                    }),
                    ...(data.arrivalDatetime && {
                        arrivalDatetime: new Date(data.arrivalDatetime),
                    }),
                },
                select: rideListSelect,
            });
            logger.info({ rideId: id, profileId }, 'Ride updated');

            // Invalidate cache for this ride and rides list
            await Promise.all([
                redis.del(cacheKey.ride(id)).catch((err) => {
                    logger.warn({ err, rideId: id }, 'Failed to invalidate ride cache');
                }),
                invalidateCache('rides:*').catch((err) => {
                    logger.warn({ err }, 'Failed to invalidate rides list cache');
                }),
            ]);

            return ride;
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to update ride');
            throw error;
        }
    }

    // Delete ride (only by driver)
    async delete(id: string, profileId: string) {
        try {
            // Check if user is the driver
            const userRide = await prisma.userRide.findFirst({
                where: { rideId: id, profileId, driver: true },
            });

            if (!userRide) throw new Error('Seul le conducteur peut supprimer cette ride');

            await prisma.ride.delete({ where: { id } });
            logger.info({ rideId: id, profileId }, 'Ride deleted');

            // Invalidate cache for this ride and rides list
            await Promise.all([
                redis.del(cacheKey.ride(id)).catch((err) => {
                    logger.warn({ err, rideId: id }, 'Failed to invalidate ride cache');
                }),
                invalidateCache('rides:*').catch((err) => {
                    logger.warn({ err }, 'Failed to invalidate rides list cache');
                }),
            ]);
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to delete ride');
            throw error;
        }
    }
}

export const rideService = new RideService();
