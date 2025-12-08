/**
 * History Routes
 * Define API endpoints for history/audit logs
 */

import { Router } from 'express';
import historyController from './history.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// All history routes require authentication
router.use(authenticate);

// All history routes require Admin or Bibliotecario role
router.use(requireRole(['Admin', 'Bibliotecario']));

/**
 * @route   GET /api/v1/history
 * @desc    Get history records with optional filters
 * @access  Private (Admin, Bibliotecario)
 * @query   usuario_id, accion_id, target_type_id, target_id, fecha_inicio, fecha_fin, limit, offset
 */
router.get('/', historyController.getHistory);

/**
 * @route   GET /api/v1/history/recent
 * @desc    Get recent activity in the system
 * @access  Private (Admin, Bibliotecario)
 * @query   limit (default: 20)
 */
router.get('/recent', historyController.getRecentActivity);

/**
 * @route   GET /api/v1/history/acciones
 * @desc    Get all available actions
 * @access  Private (Admin, Bibliotecario)
 */
router.get('/acciones', historyController.getAcciones);

/**
 * @route   GET /api/v1/history/target-types
 * @desc    Get all available target types
 * @access  Private (Admin, Bibliotecario)
 */
router.get('/target-types', historyController.getTargetTypes);

/**
 * @route   GET /api/v1/history/user/:id
 * @desc    Get activity for a specific user
 * @access  Private (Admin, Bibliotecario)
 * @query   limit (default: 50)
 */
router.get('/user/:id', historyController.getUserActivity);

/**
 * @route   GET /api/v1/history/target/:type/:id
 * @desc    Get history for a specific target (e.g., all actions on a book)
 * @access  Private (Admin, Bibliotecario)
 */
router.get('/target/:type/:id', historyController.getTargetHistory);

/**
 * @route   GET /api/v1/history/:id
 * @desc    Get history record by ID
 * @access  Private (Admin, Bibliotecario)
 */
router.get('/:id', historyController.getHistoryById);

export default router;
