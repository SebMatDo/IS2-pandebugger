import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import config from '../../config';
import { JwtPayload, LoginDto, LoginResponse } from './auth.types';
import { User } from '../../shared/types/database.types';
import { AppError } from '../../shared/middleware/errorHandler';
import { userRepository } from '../../shared/repositories/user.repository';

const SALT_ROUNDS = 10;
const JWT_SECRET: jwt.Secret = (process.env.JWT_SECRET as jwt.Secret) || 'your_jwt_secret_change_this_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password strength
   * Must have: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
   */
  validatePasswordStrength(password: string): boolean {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    return pattern.test(password);
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.correo_electronico,
      rolId: user.rol_id,
      rolNombre: user.rol?.nombre || '',
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: 124 * 60 * 60, // 1 day in seconds
    });
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new AppError('Token inválido o expirado', 401);
    }
  }

  /**
   * Create login response with user data and token
   */
  createLoginResponse(user: User, token: string): LoginResponse {
    return {
      user: {
        id: user.id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo_electronico: user.correo_electronico,
        rol: {
          id: user.rol_id,
          nombre: user.rol?.nombre || '',
        },
      },
      token,
      expiresIn: JWT_EXPIRES_IN,
    };
  }

  /**
   * Authenticate user with email and password (CU06 - Login)
   */
  async login(dto: LoginDto): Promise<LoginResponse> {
    // Query database for user by email (active users only)
    const user = await userRepository.findByEmail(dto.email);

    if (!user || !user.estado) {
      throw new AppError('❌ Credenciales inválidas o usuario inactivo', 401);
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(dto.password, user.hash_contraseña);
    if (!isPasswordValid) {
      throw new AppError('❌ Credenciales inválidas o usuario inactivo', 401);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // TODO: Log login event to historial
    // await writeToHistorial(user.id, lookupCache.accionLogin?.id, lookupCache.ttUsuario?.id, user.id);

    return this.createLoginResponse(user, token);
  }

  /**
   * Change password for authenticated user (CU20)
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.hash_contraseña);
    if (!isCurrentPasswordValid) {
      throw new AppError('Contraseña actual incorrecta', 401);
    }

    // Validate new password strength
    if (!this.validatePasswordStrength(newPassword)) {
      throw new AppError(
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo.',
        400
      );
    }

    // Hash and update password
    const newHash = await this.hashPassword(newPassword);
    await userRepository.update(userId, { hash_contraseña: newHash });

    // TODO: Log password change to historial
  }
}

export const authService = new AuthService();
