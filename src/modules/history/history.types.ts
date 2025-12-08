/**
 * History Module Types
 * Defines interfaces for audit logging system
 */

export interface HistoryRecord {
  id: number;
  fecha: Date;
  usuario_id: number | null;
  accion_id: number | null;
  target_type_id: number | null;
  target_id: number | null;
  detalles: Record<string, any> | null;
  created_at: Date;
}

export interface HistoryRecordWithDetails extends HistoryRecord {
  usuario_nombre?: string;
  usuario_email?: string;
  accion_nombre?: string;
  accion_descripcion?: string;
  target_type_nombre?: string;
  target_nombre?: string; // Nombre del libro, usuario, tarea o categoría afectado
}

export interface Accion {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: Date;
}

export interface TargetType {
  id: number;
  nombre: string;
  created_at: Date;
}

// Request/Response types
export interface CreateHistoryRequest {
  usuario_id: number;
  accion_id: number;
  target_type_id: number;
  target_id: number;
  detalles?: Record<string, any>;
}

export interface HistoryFilters {
  usuario_id?: number;
  accion_id?: number;
  target_type_id?: number;
  target_id?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryResponse {
  records: HistoryRecordWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

// Enums for better type safety
export enum AccionEnum {
  CREAR = 'crear',
  MODIFICAR = 'modificar',
  ELIMINAR = 'eliminar',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CAMBIAR_CONTRASEÑA = 'cambiar_contraseña',
  ASIGNAR_TAREA = 'asignar_tarea',
  COMPLETAR_TAREA = 'completar_tarea',
  DIGITALIZAR = 'digitalizar',
  RESTAURAR = 'restaurar',
  CLASIFICAR = 'clasificar',
  REVISAR_CALIDAD = 'revisar_calidad'
}

export enum TargetTypeEnum {
  USUARIO = 'usuario',
  LIBRO = 'libro',
  TAREA = 'tarea',
  CATEGORIA = 'categoria',
  SISTEMA = 'sistema'
}

// Helper type for creating history entries
export interface LogActionParams {
  usuario_id: number;
  accion: AccionEnum | string;
  target_type: TargetTypeEnum | string;
  target_id?: number;
  detalles?: Record<string, any>;
}
