import { AppError } from '../../shared/middleware/errorHandler';
import { Task } from '../../shared/types/database.types';
import { taskRepository } from '../../shared/repositories/tasks.repository';
import { CreateTaskDto, UpdateTaskDto, TaskResponse } from './tasks.types';


export class TasksService {
  /**
   * Convert Task to TaskResponse
   */
  private toTaskResponse(task: Task): TaskResponse {
    return {
      id: task.id,
      libro_id: task.libro_id,
      usuario_id: task.usuario_id ?? undefined,
      fecha_asignacion: task.fecha_asignacion.toISOString(),
      fecha_finalizacion: task.fecha_finalizacion?.toISOString(),
      estado_nuevo_id: task.estado_nuevo_id ?? undefined,
      observaciones: task.observaciones ?? undefined,
      created_at: task.created_at.toISOString(),
      updated_at: task.updated_at.toISOString(),

      libro: task.libro
        ? {
            id: task.libro.id,
            titulo: task.libro.titulo,
            autor: task.libro.autor ?? undefined,
            categoria: task.libro.categoria?.nombre ?? undefined,
          }
        : undefined,

      usuario: task.usuario
        ? {
            id: task.usuario.id,
            nombres: task.usuario.nombres,
            apellidos: task.usuario.apellidos,
            correo_electronico: task.usuario.correo_electronico,
          }
        : undefined,

      estado: task.estado
        ? {
            id: task.estado.id,
            nombre: task.estado.nombre,
            descripcion: task.estado.descripcion ?? undefined,
            orden: task.estado.orden,
          }
        : undefined,
    };
  }

  /**
   * Create a new task
   */
  async createTask(dto: CreateTaskDto): Promise<TaskResponse> {
    if (!dto.libro_id) {
      throw new AppError('El libro_id es obligatorio.', 400);
    }

    const newTask = await taskRepository.create(dto);
    return this.toTaskResponse(newTask);
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: number): Promise<TaskResponse> {
    const task = await taskRepository.findById(id);
    if (!task) {
      throw new AppError('Tarea no encontrada.', 404);
    }
    return this.toTaskResponse(task);
  }

  /**
   * Update task
   */
  async updateTask(id: number, dto: UpdateTaskDto): Promise<TaskResponse> {
    const existingTask = await taskRepository.findById(id);
    if (!existingTask) {
      throw new AppError('Tarea no encontrada.', 404);
    }
    
    // Validar que se envíe al menos un campo para actualizar
    const validFields = ['usuario_id', 'estado_nuevo_id', 'fecha_finalizacion', 'observaciones'];
    const receivedFields = Object.keys(dto);
    const invalidFields = receivedFields.filter(field => !validFields.includes(field));
    
    if (invalidFields.length > 0) {
      throw new AppError(
        `Campos inválidos: ${invalidFields.join(', ')}. Campos permitidos: ${validFields.join(', ')}`,
        400
      );
    }
    
    if (receivedFields.length === 0) {
      throw new AppError('Debe proporcionar al menos un campo para actualizar.', 400);
    }
    
    const updateData: Partial<Task> = {};
    
    // Mapear campos del DTO al objeto Task
    if (dto.usuario_id !== undefined) {
      updateData.usuario_id = dto.usuario_id;
    }
    if (dto.estado_nuevo_id !== undefined) {
      updateData.estado_nuevo_id = dto.estado_nuevo_id;
    }
    if (dto.fecha_finalizacion) {
      updateData.fecha_finalizacion = new Date(dto.fecha_finalizacion);
    }
    if (dto.observaciones !== undefined) {
      updateData.observaciones = dto.observaciones;
    }
    
    const updatedTask = await taskRepository.update(id, updateData);
    if (!updatedTask) {
      throw new AppError('Error al actualizar la tarea.', 500);
    }

    return this.toTaskResponse(updatedTask);
  }

  /**
   * Search tasks with optional filters
   */
  async searchTasks(filters?: { libro_id?: number; usuario_id?: number; estado_nuevo_id?: number }): Promise<TaskResponse[]> {
    const tasks = await taskRepository.search(filters ?? {});
    return tasks.map(task => this.toTaskResponse(task));
  }
}

export const tasksService = new TasksService();
