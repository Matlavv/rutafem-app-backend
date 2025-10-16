import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';

const router = Router();

router.post('/', (req, res, next) => rideController.create(req, res, next));
router.get('/', (req, res, next) => rideController.findAll(req, res, next));
router.get('/:id', (req, res, next) => rideController.findById(req, res, next));
router.patch('/:id', (req, res, next) => rideController.update(req, res, next));
router.delete('/:id', (req, res, next) => rideController.delete(req, res, next));

export default router;

