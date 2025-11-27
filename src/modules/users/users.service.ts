import { authService } from '../auth/auth.service';
import { userRepository } from '../../shared/repositories/user.repository';
import { AppError } from '../../shared/middleware/errorHandler';
import { CreateUserDto, UpdateUserDto, UserResponse } from './users.types';
import { User } from '../../shared/types/database.types';
import { db } from '../../shared/database/connection';

export class UsersService {
  /**
   * Convert User to UserResponse (without password hash)
   */
  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      nombres: user.nombres,
      apellidos: user.apellidos,
      correo_electronico: user.correo_electronico,
      rol: {
        id: user.rol_id,
        nombre: user.rol?.nombre || '',
        descripcion: user.rol?.descripcion,
      },
      estado: user.estado,
    };
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if role exists
   */
  private async roleExists(rolId: number): Promise<boolean> {
    const result = await db.query('SELECT id FROM roles WHERE id = $1', [rolId]);
    return result.rows.length > 0;
  }

  /**
   * Create a new user (CU09)
   * Only Admin and Bibliotecario can create users
   */
  async createUser(dto: CreateUserDto, creatorUserId: number): Promise<UserResponse> {
    // Validate all fields are present
    if (!dto.nombres || !dto.apellidos || !dto.correo_electronico || !dto.contraseña || !dto.rol_id) {
      throw new AppError('Por favor complete todos los campos.', 400);
    }

    // Validate email format
    if (!this.validateEmail(dto.correo_electronico)) {
      throw new AppError('Formato de correo electrónico inválido.', 400);
    }

    // Validate password strength
    if (!authService.validatePasswordStrength(dto.contraseña)) {
      throw new AppError(
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.',
        400
      );
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM usuarios WHERE correo_electronico = $1',
      [dto.correo_electronico]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('Ya existe un usuario con ese correo electrónico.', 409);
    }

    // Validate role exists
    if (!(await this.roleExists(dto.rol_id))) {
      throw new AppError('El rol seleccionado no existe.', 400);
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(dto.contraseña);

    // Create user
    const newUser = await userRepository.create({
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      correo_electronico: dto.correo_electronico,
      hash_contraseña: hashedPassword,
      rol_id: dto.rol_id,
    });

    // TODO: Log to historial
    // await writeToHistorial(creatorUserId, accionCrear.id, ttUsuario.id, newUser.id);

    // Fetch complete user data with role
    const completeUser = await userRepository.findById(newUser.id);
    if (!completeUser) {
      throw new AppError('Error al recuperar el usuario creado.', 500);
    }

    return this.toUserResponse(completeUser);
  }

  /**
   * Get all users (CU18 - Search users)
   * Returns active and inactive users
   */
  async getAllUsers(filters?: { estado?: boolean; rol_id?: number }): Promise<UserResponse[]> {
    let query = `
      SELECT u.*, r.nombre as rol_nombre, r.descripcion as rol_descripcion
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.estado !== undefined) {
      query += ` AND u.estado = $${paramCount}`;
      params.push(filters.estado);
      paramCount++;
    }

    if (filters?.rol_id) {
      query += ` AND u.rol_id = $${paramCount}`;
      params.push(filters.rol_id);
      paramCount++;
    }

    query += ' ORDER BY u.id ASC';

    const result = await db.query<any>(query, params);

    return result.rows.map((row: any) => ({
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      correo_electronico: row.correo_electronico,
      rol: {
        id: row.rol_id,
        nombre: row.rol_nombre,
        descripcion: row.rol_descripcion,
      },
      estado: row.estado,
    }));
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    return this.toUserResponse(user);
  }

  /**
   * Update user (CU10 - Edit user)
   */
  async updateUser(id: number, dto: UpdateUserDto, editorUserId: number): Promise<UserResponse> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    // Validate email if provided
    if (dto.correo_electronico && !this.validateEmail(dto.correo_electronico)) {
      throw new AppError('Formato de correo electrónico inválido.', 400);
    }

    // Check if new email already exists (if changing email)
    if (dto.correo_electronico && dto.correo_electronico !== user.correo_electronico) {
      const existingUser = await db.query(
        'SELECT id FROM usuarios WHERE correo_electronico = $1 AND id != $2',
        [dto.correo_electronico, id]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Ya existe un usuario con ese correo electrónico.', 409);
      }
    }

    // Validate role if provided
    if (dto.rol_id && !(await this.roleExists(dto.rol_id))) {
      throw new AppError('El rol seleccionado no existe.', 400);
    }

    // Update user
    const updatedUser = await userRepository.update(id, dto);

    if (!updatedUser) {
      throw new AppError('Error al actualizar el usuario.', 500);
    }

    // TODO: Log to historial
    // await writeToHistorial(editorUserId, accionEditar.id, ttUsuario.id, id);

    return this.toUserResponse(updatedUser);
  }

  /**
   * Deactivate user (CU11 - Deactivate user)
   * Sets estado = false
   */
  async deactivateUser(id: number, deactivatorUserId: number): Promise<void> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (!user.estado) {
      throw new AppError('El usuario ya está inactivo.', 400);
    }

    // Cannot deactivate yourself
    if (id === deactivatorUserId) {
      throw new AppError('No puedes desactivar tu propio usuario.', 400);
    }

    await userRepository.update(id, { estado: false });

    // TODO: Log to historial
    // await writeToHistorial(deactivatorUserId, accionDesactivar.id, ttUsuario.id, id);
  }

  /**
   * Activate user
   */
  async activateUser(id: number, activatorUserId: number): Promise<void> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    if (user.estado) {
      throw new AppError('El usuario ya está activo.', 400);
    }

    await userRepository.update(id, { estado: true });

    // TODO: Log to historial
    // await writeToHistorial(activatorUserId, accionActivar.id, ttUsuario.id, id);
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Array<{ id: number; nombre: string; descripcion: string }>> {
    const result = await db.query<{ id: number; nombre: string; descripcion: string }>(
      'SELECT id, nombre, descripcion FROM roles ORDER BY id ASC'
    );
    return result.rows;
  }
}

export const usersService = new UsersService();
