import { Response, NextFunction } from 'express';
import { tasksService } from './tasks.service';
import { createSuccessResponse } from '../../shared/utils/response';
import { CreateTaskDto, UpdateTaskDto, TaskRequest } from './tasks.types';

export class TasksController {
  /**
   * POST /api/v1/tasks
   * Create a new task
   * Requires: authenticated user
   */
  async createTask(req: TaskRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateTaskDto = req.body;

      const newTask = await tasksService.createTask(dto);

      res.status(201).json(
        createSuccessResponse(newTask, 'Tarea creada exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tasks
   * Search tasks with optional filters
   * Requires: Authentication
   */
  async searchTasks(req: TaskRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        libro_id: req.query.libro_id ? parseInt(req.query.libro_id as string) : undefined,
        usuario_id: req.query.usuario_id ? parseInt(req.query.usuario_id as string) : undefined,
        estado_nuevo_id: req.query.estado_nuevo_id ? parseInt(req.query.estado_nuevo_id as string) : undefined,
      };

      const tasks = await tasksService.searchTasks(filters);

      res.status(200).json(createSuccessResponse(tasks));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/tasks/:id
   * Get task by ID
   * Requires: Authentication
   */
  async getTaskById(req: TaskRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de tarea inválido',
        });
        return;
      }

      const task = await tasksService.getTaskById(id);

      res.status(200).json(createSuccessResponse(task));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/tasks/:id
   * Update task
   * Requires: Authentication
   */
  async updateTask(req: TaskRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateTaskDto = req.body;

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de tarea inválido',
        });
        return;
      }

      const updatedTask = await tasksService.updateTask(id, dto);

      res.status(200).json(
        createSuccessResponse(updatedTask, 'Tarea actualizada exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }
}

export const tasksController = new TasksController();
