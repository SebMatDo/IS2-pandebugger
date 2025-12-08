import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/login-anonymous', (req, res, next) => authController.loginAnonymous(req, res, next));
router.post('/restore-password', (req, res, next) => authController.restorePassword(req, res, next));

// Protected routes (require authentication)
router.post('/change-password', authenticate, (req, res, next) => authController.changePassword(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;
