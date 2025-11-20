// Authentication DTOs
import { Request } from 'express';

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    nombres: string;
    apellidos: string;
    correo_electronico: string;
    rol: {
      id: number;
      nombre: string;
    };
  };
  token: string;
  expiresIn: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  rolId: number;
  rolNombre: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RestorePasswordDto {
  email: string;
  newPassword: string;
  resetToken: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
