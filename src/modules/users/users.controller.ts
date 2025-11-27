import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { createSuccessResponse } from '../../shared/utils/response';
import { CreateUserDto, UpdateUserDto, UserRequest } from './users.types';

export class UsersController {
  /**
   * POST /api/v1/users
   * Create a new user (CU09)
   * Requires: Admin or Bibliotecario role
   */
  async createUser(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateUserDto = req.body;
      const creatorUserId = req.user!.userId;

      const newUser = await usersService.createUser(dto, creatorUserId);

      res.status(201).json(
        createSuccessResponse(newUser, 'Usuario creado exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users
   * Get all users (CU18 - Search users)
   * Requires: Authentication
   */
  async getAllUsers(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const estado = req.query.estado === 'true' ? true : req.query.estado === 'false' ? false : undefined;
      const rol_id = req.query.rol_id ? parseInt(req.query.rol_id as string) : undefined;

      const users = await usersService.getAllUsers({ estado, rol_id });

      res.status(200).json(createSuccessResponse(users));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get user by ID
   * Requires: Authentication
   */
  async getUserById(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de usuario inválido',
        });
        return;
      }

      const user = await usersService.getUserById(id);

      res.status(200).json(createSuccessResponse(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Update user (CU10)
   * Requires: Admin or Bibliotecario role
   */
  async updateUser(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const dto: UpdateUserDto = req.body;
      const editorUserId = req.user!.userId;

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de usuario inválido',
        });
        return;
      }

      const updatedUser = await usersService.updateUser(id, dto, editorUserId);

      res.status(200).json(
        createSuccessResponse(updatedUser, 'Usuario actualizado exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Deactivate user (CU11)
   * Requires: Admin or Bibliotecario role
   */
  async deactivateUser(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deactivatorUserId = req.user!.userId;

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de usuario inválido',
        });
        return;
      }

      await usersService.deactivateUser(id, deactivatorUserId);

      res.status(200).json(
        createSuccessResponse(null, 'Usuario desactivado exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/:id/activate
   * Activate user
   * Requires: Admin or Bibliotecario role
   */
  async activateUser(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const activatorUserId = req.user!.userId;

      if (isNaN(id)) {
        res.status(400).json({
          status: 'error',
          message: 'ID de usuario inválido',
        });
        return;
      }

      await usersService.activateUser(id, activatorUserId);

      res.status(200).json(
        createSuccessResponse(null, 'Usuario activado exitosamente')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/roles
   * Get all available roles
   * Requires: Authentication
   */
  async getRoles(req: UserRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await usersService.getAllRoles();

      res.status(200).json(createSuccessResponse(roles));
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
