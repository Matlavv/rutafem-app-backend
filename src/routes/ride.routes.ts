import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

/**
 * @swagger
 * /api/rides:
 *   post:
 *     summary: Create a new ride (requires authentication)
 *     tags: [Rides]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRideInput'
 *     responses:
 *       201:
 *         description: Ride created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trajet créé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireAuth, (req, res, next) => rideController.create(req, res, next));

/**
 * @swagger
 * /api/rides/{id}:
 *   patch:
 *     summary: Update a ride (requires authentication)
 *     tags: [Rides]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRideInput'
 *     responses:
 *       200:
 *         description: Ride updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trajet mis à jour
 *                 data:
 *                   $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this ride
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id', requireAuth, (req, res, next) => rideController.update(req, res, next));

/**
 * @swagger
 * /api/rides/{id}:
 *   delete:
 *     summary: Delete a ride (requires authentication)
 *     tags: [Rides]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Trajet supprimé
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to delete this ride
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireAuth, (req, res, next) => rideController.delete(req, res, next));

/**
 * @swagger
 * /api/rides:
 *   get:
 *     summary: Get all rides with pagination and filters (public)
 *     tags: [Rides]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (starts at 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: -1
 *           default: 50
 *         description: Number of items per page. Use -1 to get all items (no pagination)
 *       - in: query
 *         name: departureCity
 *         schema:
 *           type: string
 *         description: Filter by departure city
 *       - in: query
 *         name: arrivalCity
 *         schema:
 *           type: string
 *         description: Filter by arrival city
 *       - in: query
 *         name: departureDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         description: Filter by departure date (YYYY-MM-DD format, without time)
 *       - in: query
 *         name: arrivalDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-15"
 *         description: Filter by arrival date (YYYY-MM-DD format, without time)
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Maximum price filter
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum price filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Filter by ride status
 *       - in: query
 *         name: minAvailableSeats
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Minimum number of available seats
 *     responses:
 *       200:
 *         description: List of rides with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ride'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     totalCount:
 *                       type: integer
 *                       example: 258
 *                     totalPages:
 *                       type: integer
 *                       example: 6
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', cacheMiddleware(60), (req, res, next) => rideController.findAll(req, res, next));

/**
 * @swagger
 * /api/rides/{id}:
 *   get:
 *     summary: Get ride by ID (public)
 *     tags: [Rides]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ride ID
 *     responses:
 *       200:
 *         description: Ride retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ride'
 *       404:
 *         description: Ride not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', cacheMiddleware(120), (req, res, next) =>
    rideController.findById(req, res, next),
);

export default router;
