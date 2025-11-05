import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { requireAuth } from '../middleware/auth.middleware';

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
 *     summary: Get all rides (public)
 *     tags: [Rides]
 *     responses:
 *       200:
 *         description: List of all rides
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
 */
router.get('/', (req, res, next) => rideController.findAll(req, res, next));

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
router.get('/:id', (req, res, next) => rideController.findById(req, res, next));

export default router;
