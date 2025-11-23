https://www.youtube.com/watch?v=9eTVZwMZJsA
-- Database initialization script for IS2 Pandebugger
-- Run this after creating your database

-- Create tables
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS estados_libro (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS target_type (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS accion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(255) UNIQUE NOT NULL,
    hash_contraseña VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES roles(id),
    estado BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(50),
    titulo VARCHAR(255) NOT NULL,
    autor VARCHAR(255) NOT NULL,
    fecha DATE,
    numero_paginas INTEGER,
    estado_id INTEGER REFERENCES estados_libro(id),
    estanteria VARCHAR(50),
    espacio VARCHAR(50),
    categoria_id INTEGER REFERENCES categoria(id),
    directorio_pdf VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS historial (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER REFERENCES usuarios(id),
    accion_id INTEGER REFERENCES accion(id),
    target_type_id INTEGER REFERENCES target_type(id),
    target_id INTEGER
);

CREATE TABLE IF NOT EXISTS tareas (
    id SERIAL PRIMARY KEY,
    libro_id INTEGER REFERENCES libros(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion TIMESTAMP,
    estado_nuevo_id INTEGER REFERENCES estados_libro(id),
    observaciones TEXT
);

-- Insert initial reference data
INSERT INTO roles (nombre, descripcion) VALUES
    ('Admin', 'Administrador del sistema'),
    ('Bibliotecario', 'Gestiona libros y usuarios'),
    ('Digitalizador', 'Digitaliza libros físicos'),
    ('Revisor', 'Revisa calidad de digitalizaciones')
ON CONFLICT DO NOTHING;

INSERT INTO estados_libro (nombre, descripcion, orden) VALUES
    ('Registrado', 'Libro registrado en el sistema', 1),
    ('En Revisión Física', 'Revisión de condición física', 2),
    ('En Restauración', 'Proceso de restauración', 3),
    ('En Digitalización', 'Proceso de escaneo', 4),
    ('En Revisión Digital', 'Revisión de calidad digital', 5),
    ('Clasificado', 'Libro clasificado', 6),
    ('Disponible', 'Disponible para descarga', 7),
    ('Inactivo', 'Libro desactivado', 8)
ON CONFLICT DO NOTHING;

INSERT INTO categoria (nombre, descripcion) VALUES
    ('Ficción', 'Libros de ficción'),
    ('No Ficción', 'Libros de no ficción'),
    ('Ciencia', 'Libros científicos'),
    ('Historia', 'Libros de historia'),
    ('Tecnología', 'Libros de tecnología'),
    ('Arte', 'Libros de arte')
ON CONFLICT DO NOTHING;

INSERT INTO target_type (nombre) VALUES
    ('libro'),
    ('usuario'),
    ('tarea'),
    ('categoria')
ON CONFLICT DO NOTHING;

INSERT INTO accion (nombre, descripcion) VALUES
    ('crear', 'Crear un registro'),
    ('editar', 'Modificar un registro'),
    ('eliminar', 'Eliminar un registro'),
    ('login', 'Inicio de sesión'),
    ('cambiar_password', 'Cambio de contraseña'),
    ('asignar_tarea', 'Asignación de tarea'),
    ('completar_tarea', 'Completar tarea')
ON CONFLICT DO NOTHING;

-- Create a test user (password: Test123!)
-- Hash generated with bcrypt for 'Test123!' with 10 rounds
INSERT INTO usuarios (nombres, apellidos, correo_electronico, hash_contraseña, rol_id, estado)
VALUES (
    'Usuario',
    'Prueba',
    'test@pandebugger.com',
    '$2b$10$rQ3gF8qKZX3W0KqY6j9j7.xGZJvZJW5dZzKxPQH8nYqXX8EZ9k7Im',
    2,
    TRUE
)
ON CONFLICT (correo_electronico) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado ON usuarios(estado);
CREATE INDEX IF NOT EXISTS idx_libros_titulo ON libros(titulo);
CREATE INDEX IF NOT EXISTS idx_libros_autor ON libros(autor);
CREATE INDEX IF NOT EXISTS idx_libros_estado ON libros(estado_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial(fecha);
