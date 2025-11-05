import pino from 'pino';
import { prisma } from '../lib/prisma';
import { CreateRideDto, UpdateRideDto } from '../schemas/ride.schema';

const logger = pino({ level: 'info' });

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
                include: {
                    participants: {
                        include: {
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
                },
            });
            logger.info({ rideId: ride.id, profileId }, 'Ride created with driver');
            return ride;
        } catch (error) {
            logger.error({ error }, 'Failed to create ride');
            throw error;
        }
    }

    async findAll() {
        try {
            const rides = await prisma.ride.findMany({
                include: {
                    participants: {
                        include: {
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
                },
                orderBy: { departureDatetime: 'asc' },
            });
            logger.info({ count: rides.length }, 'Rides fetched');
            return rides;
        } catch (error) {
            logger.error({ error }, 'Failed to fetch rides');
            throw error;
        }
    }

    async findById(id: string) {
        try {
            const ride = await prisma.ride.findUnique({
                where: { id },
                include: { participants: { include: { profile: { include: { user: true } } } } },
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
                include: {
                    participants: {
                        include: {
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
                },
            });
            logger.info({ rideId: id, profileId }, 'Ride updated');
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
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to delete ride');
            throw error;
        }
    }
}

export const rideService = new RideService();
