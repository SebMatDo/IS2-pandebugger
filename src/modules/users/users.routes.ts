import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users/roles - Get all roles (must be before /:id route)
router.get('/roles', (req, res, next) => usersController.getRoles(req, res, next));

// GET /api/v1/users - Get all users (CU18)
router.get('/', (req, res, next) => usersController.getAllUsers(req, res, next));

// GET /api/v1/users/:id - Get user by ID
router.get('/:id', (req, res, next) => usersController.getUserById(req, res, next));

// POST /api/v1/users - Create user (CU09)
// TODO: Add role middleware to restrict to Admin and Bibliotecario
router.post('/', (req, res, next) => usersController.createUser(req, res, next));

// PUT /api/v1/users/:id - Update user (CU10)
// TODO: Add role middleware to restrict to Admin and Bibliotecario
router.put('/:id', (req, res, next) => usersController.updateUser(req, res, next));

// DELETE /api/v1/users/:id - Deactivate user (CU11)
// TODO: Add role middleware to restrict to Admin and Bibliotecario
router.delete('/:id', (req, res, next) => usersController.deactivateUser(req, res, next));

// PATCH /api/v1/users/:id/activate - Activate user
// TODO: Add role middleware to restrict to Admin and Bibliotecario
router.patch('/:id/activate', (req, res, next) => usersController.activateUser(req, res, next));

export default router;
