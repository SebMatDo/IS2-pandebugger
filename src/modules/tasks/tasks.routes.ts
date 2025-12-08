// File: tasks.routes.ts

import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { logAction } from '../../shared/middleware/historyLogger';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/tasks
 * Search tasks (optional filters)
 * Only Admin and Bibliotecario can view tasks
 */
router.get('/', requireRole(['Admin', 'Bibliotecario']), tasksController.searchTasks);

/**
 * GET /api/v1/tasks/:id
 * Get task by ID
 * Only Admin and Bibliotecario can view task details
 */
router.get('/:id', requireRole(['Admin', 'Bibliotecario']), tasksController.getTaskById);

/**
 * POST /api/v1/tasks
 * Create new task
 * Only Admin and Bibliotecario can create tasks
 */
router.post('/', requireRole(['Admin', 'Bibliotecario']), logAction('asignar_tarea', 'tarea'), tasksController.createTask);

/**
 * PUT /api/v1/tasks/:id
 * Update task
 * Only Admin and Bibliotecario can update tasks
 */
router.put('/:id', requireRole(['Admin', 'Bibliotecario']), logAction('modificar', 'tarea'), tasksController.updateTask);

export default router;