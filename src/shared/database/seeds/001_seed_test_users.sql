-- Seed: 001_seed_test_users.sql
-- Description: Create test users for development and testing
-- Environment: Development/Test only - DO NOT run in production

-- ALL TEST USERS PASSWORD: Test123!
-- Hash generated with bcrypt, rounds=10

-- Delete existing test users first to avoid conflicts
DELETE FROM usuarios WHERE correo_electronico IN (
    'admin@pandebugger.com',
    'maria.gonzalez@pandebugger.com',
    'carlos.ramirez@pandebugger.com',
    'ana.martinez@pandebugger.com',
    'luis.fernandez@pandebugger.com'
);

INSERT INTO usuarios (nombres, apellidos, correo_electronico, hash_contraseña, rol_id, estado) VALUES
    -- Admin user (Test123!)
    ('Admin', 'Sistema', 'admin@pandebugger.com', 
     '$2b$10$Hd4WtEu/SBnshsXPfT41POAyd4gbgMSiERy9b.ZbFpqbI.nT6YRya', 
     (SELECT id FROM roles WHERE nombre = 'Admin'), true),
    
    -- Bibliotecario (Test123!)
    ('María', 'González', 'maria.gonzalez@pandebugger.com',
     '$2b$10$Hd4WtEu/SBnshsXPfT41POAyd4gbgMSiERy9b.ZbFpqbI.nT6YRya',
     (SELECT id FROM roles WHERE nombre = 'Bibliotecario'), true),
    
    -- Digitalizador (Test123!)
    ('Carlos', 'Ramírez', 'carlos.ramirez@pandebugger.com',
     '$2b$10$Hd4WtEu/SBnshsXPfT41POAyd4gbgMSiERy9b.ZbFpqbI.nT6YRya',
     (SELECT id FROM roles WHERE nombre = 'Digitalizador'), true),
    
    -- Revisor (Test123!)
    ('Ana', 'Martínez', 'ana.martinez@pandebugger.com',
     '$2b$10$Hd4WtEu/SBnshsXPfT41POAyd4gbgMSiERy9b.ZbFpqbI.nT6YRya',
     (SELECT id FROM roles WHERE nombre = 'Revisor'), true),
    
    -- Restaurador (Test123!)
    ('Luis', 'Fernández', 'luis.fernandez@pandebugger.com',
     '$2b$10$Hd4WtEu/SBnshsXPfT41POAyd4gbgMSiERy9b.ZbFpqbI.nT6YRya',
     (SELECT id FROM roles WHERE nombre = 'Restaurador'), true);

-- Seed complete
