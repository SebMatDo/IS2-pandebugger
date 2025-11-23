-- Seed: 003_seed_test_tasks.sql
-- Description: Create test tasks for development and testing
-- Environment: Development/Test only

-- Assign some tasks to users for testing the workflow
INSERT INTO tareas (libro_id, usuario_id, fecha_asignacion, estado_nuevo_id, observaciones) VALUES
    -- Tarea de digitalización
    ((SELECT id FROM libros WHERE isbn = '978-0-13-468599-1'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'carlos.ramirez@pandebugger.com'),
     CURRENT_TIMESTAMP,
     (SELECT id FROM estados_libro WHERE nombre = 'En Digitalización'),
     'Digitalizar libro completo con resolución 300 DPI'),
    
    -- Tarea de revisión
    ((SELECT id FROM libros WHERE isbn = '978-0-385-50986-1'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'ana.martinez@pandebugger.com'),
     CURRENT_TIMESTAMP,
     (SELECT id FROM estados_libro WHERE nombre = 'En Revisión Digital'),
     'Revisar calidad de las imágenes digitalizadas'),
    
    -- Tarea de restauración
    ((SELECT id FROM libros WHERE isbn = '978-84-206-3765-2'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'luis.fernandez@pandebugger.com'),
     CURRENT_TIMESTAMP,
     (SELECT id FROM estados_libro WHERE nombre = 'En Restauración'),
     'Restaurar páginas dañadas antes de digitalizar')
ON CONFLICT DO NOTHING;

-- Seed complete
