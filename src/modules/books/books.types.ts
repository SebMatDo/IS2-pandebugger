// Books module types
import { Request } from 'express';
import { JwtPayload } from '../auth/auth.types';

export interface CreateBookDto {
  isbn?: string;
  titulo: string;
  autor: string;
  fecha: string; // ISO date string
  numero_paginas: number;
  estanteria: string;
  espacio: string;
  categoria_id?: number;
}

export interface UpdateBookDto {
  isbn?: string;
  titulo?: string;
  autor?: string;
  fecha?: string;
  numero_paginas?: number;
  estanteria?: string;
  espacio?: string;
  categoria_id?: number;
  estado_id?: number;
  directorio_pdf?: string;
  directorio_img?: string;
}

export interface BookResponse {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  fecha: string;
  numero_paginas: number;
  estanteria: string;
  espacio: string;
  categoria?: {
    id: number;
    nombre: string;
    descripcion?: string;
  };
  estado: {
    id: number;
    nombre: string;
    descripcion?: string;
    orden: number;
  };
  directorio_pdf: string | null;
  directorio_img: string | null;
}

export interface BookFilters {
  estado_id?: number;
  categoria_id?: number;
  titulo?: string;
  autor?: string;
  isbn?: string;
}

export interface BookRequest extends Request {
  user?: JwtPayload;
}
