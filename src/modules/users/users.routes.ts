import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { logAction } from '../../shared/middleware/historyLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users/roles - Get all roles (must be before /:id route)
// Only Admin and Bibliotecario can view roles
router.get('/roles', requireRole(['Admin', 'Bibliotecario']), (req, res, next) => usersController.getRoles(req, res, next));

// GET /api/v1/users - Get all users (CU18)
// Only Admin and Bibliotecario can view users
router.get('/', requireRole(['Admin', 'Bibliotecario']), (req, res, next) => usersController.getAllUsers(req, res, next));

// GET /api/v1/users/:id - Get user by ID
// Only Admin and Bibliotecario can view user details
router.get('/:id', requireRole(['Admin', 'Bibliotecario']), (req, res, next) => usersController.getUserById(req, res, next));

// POST /api/v1/users - Create user (CU09)
// Only Admin and Bibliotecario can create users
router.post('/', requireRole(['Admin', 'Bibliotecario']), logAction('crear', 'usuario'), (req, res, next) => usersController.createUser(req, res, next));

// PUT /api/v1/users/:id - Update user (CU10)
// Only Admin and Bibliotecario can update users
router.put('/:id', requireRole(['Admin', 'Bibliotecario']), logAction('modificar', 'usuario'), (req, res, next) => usersController.updateUser(req, res, next));

// DELETE /api/v1/users/:id - Deactivate user (CU11)
// Only Admin and Bibliotecario can deactivate users
router.delete('/:id', requireRole(['Admin', 'Bibliotecario']), logAction('eliminar', 'usuario'), (req, res, next) => usersController.deactivateUser(req, res, next));

// PATCH /api/v1/users/:id/activate - Activate user
// Only Admin and Bibliotecario can activate users
router.patch('/:id/activate', requireRole(['Admin', 'Bibliotecario']), logAction('modificar', 'usuario'), (req, res, next) => usersController.activateUser(req, res, next));

export default router;
