import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Protected routes (require authentication)
router.get('/profile', requireAuth, (req, res, next) =>
    profileController.getProfile(req, res, next),
);
router.patch('/profile', requireAuth, (req, res, next) => profileController.update(req, res, next));
router.delete('/profile', requireAuth, (req, res, next) =>
    profileController.delete(req, res, next),
);
router.post('/change-password', requireAuth, (req, res, next) =>
    profileController.changePassword(req, res, next),
);

// Public routes for list and detail
router.get('/', (req, res, next) => profileController.findAll(req, res, next));
router.get('/:id', (req, res, next) => profileController.findById(req, res, next));

export default router;
