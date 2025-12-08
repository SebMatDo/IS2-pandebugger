-- Seed: 004_seed_history_logs.sql
-- Description: Create history logs for previously seeded data
-- Environment: Development/Test only
-- This creates audit logs for the users, books, and tasks created in previous seeds

-- ===========================================
-- LOGS FOR USER CREATION
-- ===========================================
-- All users created by Admin (assuming Admin created the other users)

INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id, detalles) VALUES
    -- Admin creating Bibliotecario (María González)
    (CURRENT_TIMESTAMP - INTERVAL '5 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'usuario'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     '{"rol": "Bibliotecario", "correo": "maria.gonzalez@pandebugger.com"}'::jsonb),
    
    -- Admin creating Digitalizador (Carlos Ramírez)
    (CURRENT_TIMESTAMP - INTERVAL '5 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'usuario'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'carlos.ramirez@pandebugger.com'),
     '{"rol": "Digitalizador", "correo": "carlos.ramirez@pandebugger.com"}'::jsonb),
    
    -- Admin creating Revisor (Ana Martínez)
    (CURRENT_TIMESTAMP - INTERVAL '5 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'usuario'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'ana.martinez@pandebugger.com'),
     '{"rol": "Revisor", "correo": "ana.martinez@pandebugger.com"}'::jsonb),
    
    -- Admin creating Restaurador (Luis Fernández)
    (CURRENT_TIMESTAMP - INTERVAL '5 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'usuario'),
     (SELECT id FROM usuarios WHERE correo_electronico = 'luis.fernandez@pandebugger.com'),
     '{"rol": "Restaurador", "correo": "luis.fernandez@pandebugger.com"}'::jsonb);

-- ===========================================
-- LOGS FOR BOOK CREATION
-- ===========================================
-- Books created by Admin or Bibliotecario (María)

INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id, detalles) VALUES
    -- Admin creating "Cien años de soledad"
    (CURRENT_TIMESTAMP - INTERVAL '4 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-112008-4' LIMIT 1),
     '{"isbn": "978-0-06-112008-4", "titulo": "Cien años de soledad", "autor": "Gabriel García Márquez"}'::jsonb),
    
    -- Bibliotecario (María) creating "La sombra del viento"
    (CURRENT_TIMESTAMP - INTERVAL '4 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-84-376-0494-7' LIMIT 1),
     '{"isbn": "978-84-376-0494-7", "titulo": "La sombra del viento", "autor": "Carlos Ruiz Zafón"}'::jsonb),
    
    -- Admin creating "Sapiens: De animales a dioses"
    (CURRENT_TIMESTAMP - INTERVAL '4 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-251658-0' LIMIT 1),
     '{"isbn": "978-0-06-251658-0", "titulo": "Sapiens: De animales a dioses", "autor": "Yuval Noah Harari"}'::jsonb),
    
    -- Bibliotecario (María) creating "Una breve historia del tiempo"
    (CURRENT_TIMESTAMP - INTERVAL '3 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-385-50986-1' LIMIT 1),
     '{"isbn": "978-0-385-50986-1", "titulo": "Una breve historia del tiempo", "autor": "Stephen Hawking"}'::jsonb),
    
    -- Admin creating "Historia de España"
    (CURRENT_TIMESTAMP - INTERVAL '3 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-84-9759-870-5' LIMIT 1),
     '{"isbn": "978-84-9759-870-5", "titulo": "Historia de España", "autor": "Pierre Vilar"}'::jsonb),
    
    -- Bibliotecario (María) creating "The Pragmatic Programmer"
    (CURRENT_TIMESTAMP - INTERVAL '3 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-13-468599-1' LIMIT 1),
     '{"isbn": "978-0-13-468599-1", "titulo": "The Pragmatic Programmer", "autor": "Andrew Hunt, David Thomas"}'::jsonb),
    
    -- Admin creating "Pedagogía del oprimido"
    (CURRENT_TIMESTAMP - INTERVAL '2 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-84-368-0707-1' LIMIT 1),
     '{"isbn": "978-84-368-0707-1", "titulo": "Pedagogía del oprimido", "autor": "Paulo Freire"}'::jsonb),
    
    -- Bibliotecario (María) creating "El mundo de Sofía"
    (CURRENT_TIMESTAMP - INTERVAL '2 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-84-206-3765-2' LIMIT 1),
     '{"isbn": "978-84-206-3765-2", "titulo": "El mundo de Sofía", "autor": "Jostein Gaarder"}'::jsonb),
    
    -- Admin creating "Veinte poemas de amor y una canción desesperada"
    (CURRENT_TIMESTAMP - INTERVAL '2 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-84-376-0498-5' LIMIT 1),
     '{"isbn": "978-84-376-0498-5", "titulo": "Veinte poemas de amor y una canción desesperada", "autor": "Pablo Neruda"}'::jsonb),
    
    -- Bibliotecario (María) creating "El principito"
    (CURRENT_TIMESTAMP - INTERVAL '2 days',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'crear'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-440055-8' LIMIT 1),
     '{"isbn": "978-0-06-440055-8", "titulo": "El principito", "autor": "Antoine de Saint-Exupéry"}'::jsonb);

-- ===========================================
-- LOGS FOR TASK ASSIGNMENTS
-- ===========================================
-- Tasks assigned by Admin or Bibliotecario (María)

INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id, detalles) VALUES
    -- Admin assigning digitalization task to Carlos
    (CURRENT_TIMESTAMP - INTERVAL '1 day',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'asignar_tarea'),
     (SELECT id FROM target_type WHERE nombre = 'tarea'),
     (SELECT MIN(id) FROM tareas WHERE libro_id = (SELECT id FROM libros WHERE isbn = '978-0-13-468599-1') 
        AND usuario_id = (SELECT id FROM usuarios WHERE correo_electronico = 'carlos.ramirez@pandebugger.com')),
     '{"libro": "The Pragmatic Programmer", "asignado_a": "Carlos Ramírez", "tipo": "Digitalización"}'::jsonb),
    
    -- Bibliotecario (María) assigning review task to Ana
    (CURRENT_TIMESTAMP - INTERVAL '1 day',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'asignar_tarea'),
     (SELECT id FROM target_type WHERE nombre = 'tarea'),
     (SELECT MIN(id) FROM tareas WHERE libro_id = (SELECT id FROM libros WHERE isbn = '978-0-385-50986-1')
        AND usuario_id = (SELECT id FROM usuarios WHERE correo_electronico = 'ana.martinez@pandebugger.com')),
     '{"libro": "Una breve historia del tiempo", "asignado_a": "Ana Martínez", "tipo": "Revisión"}'::jsonb),
    
    -- Admin assigning restoration task to Luis
    (CURRENT_TIMESTAMP - INTERVAL '1 day',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'asignar_tarea'),
     (SELECT id FROM target_type WHERE nombre = 'tarea'),
     (SELECT MIN(id) FROM tareas WHERE libro_id = (SELECT id FROM libros WHERE isbn = '978-84-206-3765-2')
        AND usuario_id = (SELECT id FROM usuarios WHERE correo_electronico = 'luis.fernandez@pandebugger.com')),
     '{"libro": "El mundo de Sofía", "asignado_a": "Luis Fernández", "tipo": "Restauración"}'::jsonb);

-- ===========================================
-- LOGS FOR BOOK STATE CHANGES
-- ===========================================
-- Some books have been moved through workflow states

INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id, detalles) VALUES
    -- Cien años de soledad moved to Disponible
    (CURRENT_TIMESTAMP - INTERVAL '12 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'actualizar'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-112008-4' LIMIT 1),
     '{"campo": "estado", "valor_anterior": "En Clasificación", "valor_nuevo": "Disponible"}'::jsonb),
    
    -- Sapiens moved to Disponible
    (CURRENT_TIMESTAMP - INTERVAL '10 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'actualizar'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-251658-0' LIMIT 1),
     '{"campo": "estado", "valor_anterior": "En Clasificación", "valor_nuevo": "Disponible"}'::jsonb),
    
    -- El principito moved to Disponible
    (CURRENT_TIMESTAMP - INTERVAL '8 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'actualizar'),
     (SELECT id FROM target_type WHERE nombre = 'libro'),
     (SELECT id FROM libros WHERE isbn = '978-0-06-440055-8' LIMIT 1),
     '{"campo": "estado", "valor_anterior": "En Revisión Digital", "valor_nuevo": "Disponible"}'::jsonb);

-- ===========================================
-- LOGS FOR LOGIN ACTIVITY (Sample)
-- ===========================================
-- Recent login activity from various users

INSERT INTO historial (fecha, usuario_id, accion_id, target_type_id, target_id, detalles) VALUES
    -- Admin login today
    (CURRENT_TIMESTAMP - INTERVAL '2 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'admin@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'login'),
     (SELECT id FROM target_type WHERE nombre = 'sistema'),
     NULL,
     '{"ip": "192.168.1.100"}'::jsonb),
    
    -- María login today
    (CURRENT_TIMESTAMP - INTERVAL '3 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'maria.gonzalez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'login'),
     (SELECT id FROM target_type WHERE nombre = 'sistema'),
     NULL,
     '{"ip": "192.168.1.101"}'::jsonb),
    
    -- Carlos login today
    (CURRENT_TIMESTAMP - INTERVAL '4 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'carlos.ramirez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'login'),
     (SELECT id FROM target_type WHERE nombre = 'sistema'),
     NULL,
     '{"ip": "192.168.1.102"}'::jsonb),
    
    -- Ana login yesterday
    (CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '1 hour',
     (SELECT id FROM usuarios WHERE correo_electronico = 'ana.martinez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'login'),
     (SELECT id FROM target_type WHERE nombre = 'sistema'),
     NULL,
     '{"ip": "192.168.1.103"}'::jsonb),
    
    -- Luis login yesterday
    (CURRENT_TIMESTAMP - INTERVAL '1 day' - INTERVAL '2 hours',
     (SELECT id FROM usuarios WHERE correo_electronico = 'luis.fernandez@pandebugger.com'),
     (SELECT id FROM accion WHERE nombre = 'login'),
     (SELECT id FROM target_type WHERE nombre = 'sistema'),
     NULL,
     '{"ip": "192.168.1.104"}'::jsonb);

-- Seed complete
