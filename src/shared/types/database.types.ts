// Usuario (User) - from usuarios table
export interface User {
  id: number;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  hash_contraseña: string;
  rol_id: number;
  estado: boolean; // true = active, false = inactive
  rol?: Role;
}

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
  contraseña?: string;
  rol_id?: number;
  estado?: boolean;
}

// Rol (Role) - from roles table
export interface Role {
  id: number;
  nombre: string;
  descripcion: string;
}

// Libro (Book) - from libros table
export interface Book {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  fecha: Date;
  numero_paginas: number;
  estado_id: number;
  estanteria: string;
  espacio: string;
  categoria_id: number;
  directorio_pdf: string;
  estado?: BookState;
  categoria?: Category;
}

export interface CreateBookDto {
  isbn?: string;
  titulo: string;
  autor: string;
  fecha: Date;
  numero_paginas: number;
  estanteria: string;
  espacio: string;
  categoria_id?: number;
  estado_id?: number; // defaults to "Registrado"
  directorio_pdf?: string;
}

export interface UpdateBookDto {
  isbn?: string;
  titulo?: string;
  autor?: string;
  fecha?: Date;
  numero_paginas?: number;
  estanteria?: string;
  espacio?: string;
  categoria_id?: number;
  estado_id?: number;
  directorio_pdf?: string;
}

// EstadoLibro (Book State) - from estados_libro table
export interface BookState {
  id: number;
  nombre: string;
  descripcion: string;
  orden: number;
}

// Categoria (Category) - from categoria table
export interface Category {
  id: number;
  nombre: string;
  descripcion: string;
}

// Historial (History/Audit Log) - from historial table
export interface History {
  id: number;
  fecha: Date;
  usuario_id: number;
  accion_id: number;
  target_type_id: number;
  target_id: number;
  usuario?: User;
  accion?: Action;
  target_type?: TargetType;
}

export interface CreateHistoryDto {
  usuario_id: number;
  accion_id: number;
  target_type_id: number;
  target_id: number;
}

// Accion (Action for history) - from accion table
export interface Action {
  id: number;
  nombre: string;
  descripcion: string;
}

// TargetType (Target Type for history) - from target_type table
export interface TargetType {
  id: number;
  nombre: string;
}

// Tarea (Task) - from tareas table
export interface Task {
  id: number;
  libro_id: number;
  usuario_id: number;
  fecha_asignacion: Date;
  fecha_finalizacion: Date;
  estado_nuevo_id: number;
  observaciones: string;
  libro?: Book;
  usuario?: User;
  estado?: BookState;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateTaskDto {
  libro_id: number;
  usuario_id: number;
  estado_nuevo_id: number;
  observaciones?: string;
}

export interface UpdateTaskDto {
  fecha_finalizacion?: Date;
  estado_nuevo_id?: number;
  observaciones?: string;
}

// Search/Filter DTOs
export interface BookSearchFilters {
  titulo?: string;
  autor?: string;
  isbn?: string;
  categoria_id?: number;
  estado_id?: number;
}

export interface UserSearchFilters {
  nombres?: string;
  apellidos?: string;
  correo_electronico?: string;
  rol_id?: number;
  estado?: boolean;
}
