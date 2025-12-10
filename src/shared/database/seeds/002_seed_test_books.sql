-- Seed: 002_seed_test_books.sql
-- Description: Create test books for development and testing
-- Environment: Development/Test only

INSERT INTO libros (isbn, titulo, autor, fecha, numero_paginas, estado_id, estanteria, espacio, categoria_id, directorio_pdf, directorio_img) VALUES
    -- Ficción
    ('978-0-06-112008-4', 'Cien años de soledad', 'Gabriel García Márquez', '1967-05-30', 417,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'A', '001', (SELECT id FROM categoria WHERE nombre = 'Ficción'), '/books/cien-anos-soledad.pdf', '/covers/cien-anos-soledad.jpg'),
    
    ('978-84-376-0494-7', 'La sombra del viento', 'Carlos Ruiz Zafón', '2001-04-17', 576,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'A', '002', (SELECT id FROM categoria WHERE nombre = 'Ficción'), '/books/sombra-viento.pdf', '/covers/sombra-viento.jpg'),
    -- No Ficción
    ('978-0-06-251658-0', 'Sapiens: De animales a dioses', 'Yuval Noah Harari', '2011-01-01', 443,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'B', '001', (SELECT id FROM categoria WHERE nombre = 'No Ficción'), '/books/sapiens.pdf', '/covers/sapiens.jpg'),
    
    -- Ciencia
    ('978-0-385-50986-1', 'Una breve historia del tiempo', 'Stephen Hawking', '1988-04-01', 256,
     (SELECT id FROM estados_libro WHERE nombre = 'En Revisión Digital'),
     'C', '001', (SELECT id FROM categoria WHERE nombre = 'Ciencia'), NULL, NULL),
    
    -- Historia
    ('978-84-9759-870-5', 'Historia de España', 'Pierre Vilar', '1947-01-01', 542,
     (SELECT id FROM estados_libro WHERE nombre = 'Registrado'),
     'D', '001', (SELECT id FROM categoria WHERE nombre = 'Historia'), NULL, NULL),
    
    -- Tecnología
    ('978-0-13-468599-1', 'The Pragmatic Programmer', 'Andrew Hunt, David Thomas', '1999-10-20', 352,
     (SELECT id FROM estados_libro WHERE nombre = 'En Digitalización'),
     'E', '001', (SELECT id FROM categoria WHERE nombre = 'Tecnología'), NULL, NULL),
    
    -- Educación
    ('978-84-368-0707-1', 'Pedagogía del oprimido', 'Paulo Freire', '1970-01-01', 246,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'F', '001', (SELECT id FROM categoria WHERE nombre = 'Educación'), '/books/pedagogia-oprimido.pdf', '/covers/pedagogia-oprimido.jpg'),
    
    -- Filosofía
    ('978-84-206-3765-2', 'El mundo de Sofía', 'Jostein Gaarder', '1991-01-01', 638,
     (SELECT id FROM estados_libro WHERE nombre = 'En Restauración'),
     'G', '001', (SELECT id FROM categoria WHERE nombre = 'Filosofía'), NULL, NULL),
    
    -- Poesía
    ('978-84-376-0498-5', 'Veinte poemas de amor y una canción desesperada', 'Pablo Neruda', '1924-06-16', 132,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'H', '001', (SELECT id FROM categoria WHERE nombre = 'Poesía'), '/books/veinte-poemas.pdf', '/covers/veinte-poemas.jpg'),
    
    -- Literatura Infantil
    ('978-0-06-440055-8', 'El principito', 'Antoine de Saint-Exupéry', '1943-04-06', 96,
     (SELECT id FROM estados_libro WHERE nombre = 'Disponible'),
     'I', '001', (SELECT id FROM categoria WHERE nombre = 'Literatura Infantil'), '/books/principito.pdf', '/covers/principito.jpg')
ON CONFLICT DO NOTHING;

-- Seed complete
