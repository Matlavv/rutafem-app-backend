import path from 'path';
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'RutaFem API',
            version: '1.0.0',
            description: 'API documentation for RutaFem - Covoiturage entre femmes',
            contact: {
                name: 'RutaFem Team',
            },
        },
        servers: [
            {
                url: process.env.BASE_URL || 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your session token',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        name: { type: 'string' },
                        emailVerified: { type: 'boolean' },
                    },
                },
                Profile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        firstname: { type: 'string' },
                        lastname: { type: 'string' },
                        username: { type: 'string' },
                        phoneNumber: { type: 'string' },
                        profileImageUrl: { type: 'string', format: 'uri', nullable: true },
                        experience: { type: 'string', nullable: true },
                        biography: { type: 'string', nullable: true },
                        favoriteMusic: { type: 'string', nullable: true },
                        birthDate: { type: 'string', format: 'date-time' },
                        isVerified: { type: 'boolean' },
                        isDriverVerified: { type: 'boolean' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                        user: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', format: 'email' },
                                emailVerified: { type: 'boolean' },
                            },
                        },
                    },
                },
                RegisterInput: {
                    type: 'object',
                    required: [
                        'email',
                        'password',
                        'firstname',
                        'lastname',
                        'username',
                        'phoneNumber',
                        'birthDate',
                    ],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'marie@example.com' },
                        password: {
                            type: 'string',
                            minLength: 8,
                            maxLength: 128,
                            example: 'Password123!',
                            description:
                                'Must contain uppercase, lowercase, number and special character',
                        },
                        firstname: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'Marie',
                        },
                        lastname: {
                            type: 'string',
                            minLength: 1,
                            maxLength: 100,
                            example: 'Dupont',
                        },
                        username: {
                            type: 'string',
                            minLength: 3,
                            maxLength: 50,
                            example: 'marie_d',
                        },
                        phoneNumber: {
                            type: 'string',
                            pattern: '^\\+?[1-9]\\d{1,14}$',
                            example: '+33612345678',
                        },
                        birthDate: {
                            type: 'string',
                            format: 'date-time',
                            example: '1995-05-15T00:00:00Z',
                        },
                    },
                },
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'marie@example.com' },
                        password: { type: 'string', minLength: 8, example: 'Password123!' },
                    },
                },
                UpdateProfileInput: {
                    type: 'object',
                    properties: {
                        firstname: { type: 'string', minLength: 1, maxLength: 100 },
                        lastname: { type: 'string', minLength: 1, maxLength: 100 },
                        username: { type: 'string', minLength: 3, maxLength: 50 },
                        phoneNumber: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' },
                        profileImageUrl: { type: 'string', format: 'uri' },
                        experience: { type: 'string', maxLength: 500 },
                        biography: { type: 'string', maxLength: 1000 },
                        favoriteMusic: { type: 'string', maxLength: 200 },
                        birthDate: { type: 'string', format: 'date-time' },
                    },
                },
                ChangePasswordInput: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword'],
                    properties: {
                        currentPassword: { type: 'string', minLength: 8 },
                        newPassword: { type: 'string', minLength: 8, maxLength: 128 },
                    },
                },
                Ride: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        driverId: { type: 'string', format: 'uuid' },
                        startingAddress: { type: 'string' },
                        arrivalAddress: { type: 'string' },
                        departureCity: { type: 'string' },
                        arrivalCity: { type: 'string' },
                        departureDatetime: { type: 'string', format: 'date-time' },
                        arrivalDatetime: { type: 'string', format: 'date-time' },
                        price: { type: 'number', minimum: 0 },
                        availableSeats: { type: 'integer', minimum: 1 },
                        vehicleId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                CreateRideInput: {
                    type: 'object',
                    required: [
                        'startingAddress',
                        'arrivalAddress',
                        'departureCity',
                        'arrivalCity',
                        'departureDatetime',
                        'arrivalDatetime',
                        'price',
                        'availableSeats',
                        'vehicleId',
                    ],
                    properties: {
                        startingAddress: {
                            type: 'string',
                            minLength: 1,
                            example: '10 Rue de la Paix, Paris',
                        },
                        arrivalAddress: {
                            type: 'string',
                            minLength: 1,
                            example: '20 Avenue des Champs, Lyon',
                        },
                        departureCity: { type: 'string', minLength: 1, example: 'Paris' },
                        arrivalCity: { type: 'string', minLength: 1, example: 'Lyon' },
                        departureDatetime: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-11-10T09:00:00Z',
                        },
                        arrivalDatetime: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-11-10T13:00:00Z',
                        },
                        price: { type: 'number', minimum: 0, example: 25.5 },
                        availableSeats: { type: 'integer', minimum: 1, example: 3 },
                        vehicleId: { type: 'string', minLength: 1, example: 'vehicle-uuid-123' },
                    },
                },
                UpdateRideInput: {
                    type: 'object',
                    properties: {
                        startingAddress: { type: 'string', minLength: 1 },
                        arrivalAddress: { type: 'string', minLength: 1 },
                        departureCity: { type: 'string', minLength: 1 },
                        arrivalCity: { type: 'string', minLength: 1 },
                        departureDatetime: { type: 'string', format: 'date-time' },
                        arrivalDatetime: { type: 'string', format: 'date-time' },
                        price: { type: 'number', minimum: 0 },
                        availableSeats: { type: 'integer', minimum: 1 },
                        vehicleId: { type: 'string', minLength: 1 },
                    },
                },
            },
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Profile', description: 'Profile management endpoints' },
            { name: 'Rides', description: 'Ride management endpoints' },
        ],
    },
    apis: [path.join(__dirname, '../routes/*.ts')],
};

export const swaggerSpec = swaggerJsdoc(options);
