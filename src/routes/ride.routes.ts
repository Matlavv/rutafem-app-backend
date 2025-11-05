import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Protected routes (require authentication)
router.post('/', requireAuth, (req, res, next) => rideController.create(req, res, next));
router.patch('/:id', requireAuth, (req, res, next) => rideController.update(req, res, next));
router.delete('/:id', requireAuth, (req, res, next) => rideController.delete(req, res, next));

// Public routes
router.get('/', (req, res, next) => rideController.findAll(req, res, next));
router.get('/:id', (req, res, next) => rideController.findById(req, res, next));

export default router;
