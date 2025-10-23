import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

// Routes publiques
router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/session', (req, res, next) => authController.getSession(req, res, next));

export default router;
