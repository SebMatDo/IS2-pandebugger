//task management system types
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.types';

export interface CreateTaskDto {
  libro_id: number;                
  usuario_id?: number;             
  estado_nuevo_id?: number;            
  observaciones?: string;          
}

export interface UpdateTaskDto {            
  estado_nuevo_id?: number;        
  fecha_finalizacion?: string;     
  observaciones?: string;          
}

export interface TaskResponse {
  id: number;
  libro_id: number;
  usuario_id?: number;
  fecha_asignacion: string;
  fecha_finalizacion?: string;
  estado_nuevo_id?: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;

  libro?: {
    id: number;
    titulo: string;
    autor?: string;
    categoria?: string;
  };
  usuario?: {
    id: number;
    nombres: string;
    apellidos: string;
    correo_electronico: string;
  };
  estado?: {
  id: number;
  nombre: string;
  descripcion?: string;
  orden: number;
};

}

export interface TaskRequest extends Request {
  user?: JwtPayload;
}
