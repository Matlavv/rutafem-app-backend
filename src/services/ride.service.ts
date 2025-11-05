import pino from 'pino';
import { prisma } from '../lib/prisma';
import { CreateRideDto, UpdateRideDto } from '../schemas/ride.schema';

const logger = pino({ level: 'info' });

export class RideService {
    async create(data: CreateRideDto) {
        try {
            const ride = await prisma.ride.create({
                data: {
                    ...data,
                    departureDatetime: new Date(data.departureDatetime),
                    arrivalDatetime: new Date(data.arrivalDatetime),
                    status: 'pending',
                },
            });
            logger.info({ rideId: ride.id }, 'Ride created');
            return ride;
        } catch (error) {
            logger.error({ error }, 'Failed to create ride');
            throw error;
        }
    }

    async findAll() {
        try {
            const rides = await prisma.ride.findMany({
                include: { participants: true },
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

    async update(id: string, data: UpdateRideDto) {
        try {
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
            });
            logger.info({ rideId: id }, 'Ride updated');
            return ride;
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to update ride');
            throw error;
        }
    }

    async delete(id: string) {
        try {
            await prisma.ride.delete({ where: { id } });
            logger.info({ rideId: id }, 'Ride deleted');
        } catch (error) {
            logger.error({ error, rideId: id }, 'Failed to delete ride');
            throw error;
        }
    }
}

export const rideService = new RideService();
