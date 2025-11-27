// User management types
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.types';

export interface CreateUserDto {
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  contraseña: string;
  rol_id: number;
}

export interface UpdateUserDto {
  nombres?: string;
  apellidos?: string;
  correo_electronico?: string;
  rol_id?: number;
  estado?: boolean;
}

export interface UserResponse {
  id: number;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  rol: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  estado: boolean;
}

export interface UserRequest extends Request {
  user?: JwtPayload;
}
