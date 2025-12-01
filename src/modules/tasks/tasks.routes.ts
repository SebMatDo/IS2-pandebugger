// File: tasks.routes.ts

import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/tasks
 * Search tasks (optional filters)
 */
router.get('/', tasksController.searchTasks);

/**
 * GET /api/v1/tasks/:id
 * Get task by ID
 */
router.get('/:id', tasksController.getTaskById);

/**
 * POST /api/v1/tasks
 * Create new task
 */
router.post('/', tasksController.createTask);

/**
 * PUT /api/v1/tasks/:id
 * Update task
 */
router.put('/:id', tasksController.updateTask);

export default router;