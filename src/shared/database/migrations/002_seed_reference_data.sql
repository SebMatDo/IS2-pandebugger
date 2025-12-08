-- Migration: 002_seed_reference_data.sql
-- Description: Insert initial reference/lookup data
-- Date: 2025-11-23

-- ===========================================
-- ROLES
-- ===========================================

INSERT INTO roles (nombre, descripcion) VALUES
    ('Admin', 'Administrador del sistema con acceso completo'),
    ('Bibliotecario', 'Gestiona libros, usuarios y reportes'),
    ('Digitalizador', 'Digitaliza libros físicos y sube archivos'),
    ('Revisor', 'Revisa calidad de digitalizaciones y metadatos'),
    ('Restaurador', 'Especialista en restauración de libros físicos'),
    ('Lector', 'Usuario anónimo con acceso de solo lectura a libros publicados')
ON CONFLICT (nombre) DO NOTHING;

-- ===========================================
-- ESTADOS DE LIBRO (workflow)
-- ===========================================

INSERT INTO estados_libro (nombre, descripcion, orden) VALUES
    ('Registrado', 'Libro registrado en el sistema, pendiente de revisión', 1),
    ('En Revisión Física', 'Revisión de condición física del libro', 2),
    ('En Restauración', 'Proceso de restauración física', 3),
    ('En Digitalización', 'Proceso de escaneo y digitalización', 4),
    ('En Revisión Digital', 'Revisión de calidad de archivos digitales', 5),
    ('En Clasificación', 'Proceso de clasificación y metadatos', 6),
    ('Disponible', 'Disponible para consulta y descarga', 7),
    ('Inactivo', 'Libro desactivado temporalmente', 8),
    ('Archivado', 'Libro archivado, no disponible', 9)
ON CONFLICT (nombre) DO NOTHING;

-- ===========================================
-- CATEGORÍAS
-- ===========================================

INSERT INTO categoria (nombre, descripcion) VALUES
    ('Ficción', 'Novelas, cuentos y literatura de ficción'),
    ('No Ficción', 'Ensayos, biografías y obras documentales'),
    ('Ciencia', 'Libros científicos y técnicos'),
    ('Historia', 'Obras históricas y documentación histórica'),
    ('Arte', 'Arte, diseño y fotografía'),
    ('Tecnología', 'Informática, ingeniería y tecnología'),
    ('Educación', 'Textos educativos y académicos'),
    ('Filosofía', 'Filosofía y pensamiento'),
    ('Derecho', 'Textos legales y jurídicos'),
    ('Medicina', 'Textos médicos y de salud'),
    ('Literatura Infantil', 'Libros para niños y jóvenes'),
    ('Poesía', 'Colecciones de poesía'),
    ('Teatro', 'Obras de teatro y dramaturgia'),
    ('Referencia', 'Diccionarios, enciclopedias y obras de consulta'),
    ('Otro', 'Categoría general para otros tipos de libros')
ON CONFLICT (nombre) DO NOTHING;

-- ===========================================
-- TIPOS DE TARGET (para historial)
-- ===========================================

INSERT INTO target_type (nombre) VALUES
    ('libro'),
    ('usuario'),
    ('tarea'),
    ('categoria'),
    ('sistema')
ON CONFLICT (nombre) DO NOTHING;

-- ===========================================
-- ACCIONES (para historial)
-- ===========================================

INSERT INTO accion (nombre, descripcion) VALUES
    ('crear', 'Creación de un nuevo registro'),
    ('actualizar', 'Actualización de un registro existente'),
    ('eliminar', 'Eliminación o desactivación de un registro'),
    ('login', 'Inicio de sesión de usuario'),
    ('logout', 'Cierre de sesión de usuario'),
    ('asignar_tarea', 'Asignación de tarea a usuario'),
    ('completar_tarea', 'Finalización de tarea'),
    ('cambiar_estado', 'Cambio de estado de libro'),
    ('subir_archivo', 'Subida de archivo digital'),
    ('descargar', 'Descarga de archivo'),
    ('restaurar', 'Restauración de contraseña u objeto'),
    ('generar_reporte', 'Generación de reporte')
ON CONFLICT (nombre) DO NOTHING;

-- Migration complete
