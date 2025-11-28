# Books Module

Este módulo maneja la gestión completa de libros en el sistema de digitalización, incluyendo registro, consulta, modificación y desactivación.

## Casos de Uso Implementados

- **CU01 - Registrar Libro**: Permite registrar nuevos libros en el sistema con estado inicial "Registrado"
- **CU17 - Buscar Libros**: Permite listar y buscar libros con filtros (con acceso basado en roles)
- **CU22 - Consultar Libro**: Permite consultar detalles de un libro específico
- **CU12 - Modificar Libro**: Permite actualizar información de un libro existente
- **CU13 - Desactivar Libro**: Permite desactivar/eliminar un libro del catálogo
- **CU25 - Crear Categoría**: Permite crear nuevas categorías de libros

## Control de Acceso

### Endpoints Públicos (con autenticación opcional)
Los libros en estado **"Publicado"** son accesibles por cualquier usuario (autenticado o no):

- `GET /api/v1/books` - Listar libros
- `GET /api/v1/books/:id` - Consultar libro específico
- `GET /api/v1/books/states` - Listar estados de libros
- `GET /api/v1/books/categories` - Listar categorías

**Comportamiento por rol:**
- **Sin autenticación**: Solo ve libros en estado "Publicado"
- **Usuarios autenticados con roles** (Admin, Bibliotecario, Digitalizador, Revisor, Restaurador): Ven todos los libros independientemente del estado

### Endpoints Protegidos (requieren autenticación)
Solo usuarios con roles **Admin** y **Bibliotecario** pueden:

- `POST /api/v1/books` - Crear libro
- `PUT /api/v1/books/:id` - Modificar libro
- `DELETE /api/v1/books/:id` - Desactivar libro
- `POST /api/v1/books/categories` - Crear categoría

## Estructura de Datos

### CreateBookDto (CU01 - Registrar Libro)
```typescript
{
  isbn?: string;           // Opcional
  titulo: string;          // Requerido
  autor: string;           // Requerido
  fecha: string;           // Fecha ISO (YYYY-MM-DD)
  numero_paginas: number;  // Requerido, > 0
  estanteria: string;      // Requerido
  espacio: string;         // Requerido
  categoria_id?: number;   // Opcional
}
```

### UpdateBookDto (CU12 - Modificar Libro)
```typescript
{
  isbn?: string;
  titulo?: string;
  autor?: string;
  fecha?: string;
  numero_paginas?: number;
  estanteria?: string;
  espacio?: string;
  categoria_id?: number;
  estado_id?: number;       // Para cambiar estado del libro
  directorio_pdf?: string;  // Para cuando se digitaliza
}
```

### BookResponse
```typescript
{
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
    descripcion: string;
  };
  estado: {
    id: number;
    nombre: string;
    descripcion: string;
    orden: number;
  };
  directorio_pdf: string | null;
}
```

### BookFilters (CU17 - Buscar Libros)
```typescript
{
  estado_id?: number;
  categoria_id?: number;
  titulo?: string;    // Búsqueda parcial (ILIKE)
  autor?: string;     // Búsqueda parcial (ILIKE)
  isbn?: string;      // Búsqueda parcial (ILIKE)
}
```

## Estados del Libro

El flujo de estados de un libro es:

1. **Registrado** - Estado inicial cuando se crea el libro (CU01)
2. **En revisión** - En proceso de revisión física
3. **En digitalización** - En proceso de digitalización
4. **En restauración** - En proceso de restauración física
5. **En proceso** - En procesamiento general
6. **Digitalizado** - Digitalización completada
7. **Publicado** - Libro publicado y accesible públicamente

## API Endpoints

### 1. Crear Libro (CU01)
```bash
POST /api/v1/books
Authorization: Bearer <token>

{
  "titulo": "El Quijote",
  "autor": "Miguel de Cervantes",
  "fecha": "1605-01-16",
  "numero_paginas": 863,
  "estanteria": "A1",
  "espacio": "B2",
  "isbn": "978-84-376-0494-7",
  "categoria_id": 1
}

# Respuesta
{
  "success": true,
  "message": "Libro registrado exitosamente.",
  "data": { ...BookResponse }
}
```

### 2. Listar Libros (CU17)
```bash
# Sin autenticación (solo libros publicados)
GET /api/v1/books

# Con autenticación (todos los libros según rol)
GET /api/v1/books
Authorization: Bearer <token>

# Con filtros
GET /api/v1/books?titulo=quijote&categoria_id=1&estado_id=7

# Respuesta
{
  "success": true,
  "data": [ ...BookResponse[] ],
  "count": 10
}
```

### 3. Consultar Libro (CU22)
```bash
GET /api/v1/books/:id
# Opcional: Authorization: Bearer <token>

# Respuesta
{
  "success": true,
  "data": { ...BookResponse }
}
```

### 4. Modificar Libro (CU12)
```bash
PUT /api/v1/books/:id
Authorization: Bearer <token>

{
  "numero_paginas": 900,
  "estado_id": 7,
  "directorio_pdf": "/books/pdfs/el-quijote.pdf"
}

# Respuesta
{
  "success": true,
  "message": "Libro actualizado exitosamente.",
  "data": { ...BookResponse }
}
```

### 5. Desactivar Libro (CU13)
```bash
DELETE /api/v1/books/:id
Authorization: Bearer <token>

# Respuesta
{
  "success": true,
  "message": "Libro desactivado exitosamente."
}
```

### 6. Listar Estados
```bash
GET /api/v1/books/states

# Respuesta
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Registrado",
      "descripcion": "Libro registrado en el sistema",
      "orden": 1
    },
    ...
  ]
}
```

### 7. Listar Categorías
```bash
GET /api/v1/books/categories

# Respuesta
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Literatura",
      "descripcion": "Obras literarias"
    },
    ...
  ]
}
```

### 8. Crear Categoría (CU25)
```bash
POST /api/v1/books/categories
Authorization: Bearer <token>

{
  "nombre": "Ciencia Ficción",
  "descripcion": "Novelas de ciencia ficción"
}

# Respuesta
{
  "success": true,
  "message": "Categoría creada exitosamente.",
  "data": {
    "id": 10,
    "nombre": "Ciencia Ficción",
    "descripcion": "Novelas de ciencia ficción"
  }
}
```

## Validaciones

### Crear Libro (CU01)
- `titulo`, `autor`, `numero_paginas`, `estanteria`, `espacio` son obligatorios
- `numero_paginas` debe ser > 0
- `categoria_id` debe existir si se proporciona
- Estado inicial siempre es "Registrado"

### Modificar Libro (CU12)
- `numero_paginas` debe ser > 0 si se proporciona
- `categoria_id` debe existir si se proporciona
- `estado_id` debe existir si se proporciona
- Al menos un campo debe ser actualizado

### Crear Categoría (CU25)
- `nombre` es obligatorio
- No puede haber categorías duplicadas por nombre

## Manejo de Errores

- **400 Bad Request**: Datos inválidos o faltantes
- **401 Unauthorized**: Token faltante o inválido
- **403 Forbidden**: Usuario sin permisos suficientes
- **404 Not Found**: Libro, categoría o estado no encontrado
- **409 Conflict**: Categoría duplicada
- **500 Internal Server Error**: Error del servidor

## Testing

Para probar el módulo:

```bash
# Ejecutar todos los tests (cuando estén implementados)
npm run test:books

# Con coverage
npm run test:books:coverage
```

## Próximos Pasos

1. Implementar tests unitarios para el módulo de libros
2. Agregar casos de uso adicionales:
   - CU02 - Registrar Condición
   - CU03 - Restaurar Libro
   - CU04 - Digitalizar Libro
   - CU05 - Clasificar Libro
   - CU07 - Consultar Historial
   - CU15 - Control de Calidad Físico
   - CU16 - Filtrar por Estado
   - CU24 - Control de Calidad Digital
3. Implementar historial de cambios (writeToHistorial)
4. Agregar paginación a listado de libros
5. Implementar soft delete en lugar de DELETE físico

## Arquitectura

```
src/modules/books/
├── books.types.ts       # Tipos e interfaces TypeScript
├── books.service.ts     # Lógica de negocio
├── books.controller.ts  # Controladores HTTP
├── books.routes.ts      # Definición de rutas
└── README.md           # Esta documentación
```

## Base de Datos

### Tabla: libros
```sql
CREATE TABLE libros (
  id SERIAL PRIMARY KEY,
  isbn VARCHAR(20),
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255) NOT NULL,
  fecha DATE,
  numero_paginas INTEGER NOT NULL,
  estanteria VARCHAR(50) NOT NULL,
  espacio VARCHAR(50) NOT NULL,
  categoria_id INTEGER REFERENCES categoria(id),
  estado_id INTEGER REFERENCES estados_libro(id) NOT NULL,
  directorio_pdf TEXT
);
```

### Tabla: estados_libro
```sql
CREATE TABLE estados_libro (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  orden INTEGER NOT NULL
);
```

### Tabla: categoria
```sql
CREATE TABLE categoria (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT
);
```

## TODO

### Testing
- [ ] Crear tests unitarios para `books.service.ts`
  - [ ] Test createBook (CU01)
  - [ ] Test getAllBooks con filtros y roles (CU17)
  - [ ] Test getBookById con permisos (CU22)
  - [ ] Test updateBook (CU12)
  - [ ] Test deactivateBook (CU13)
  - [ ] Test createCategory (CU25)
- [ ] Crear tests unitarios para `books.controller.ts`

### Casos de Uso Pendientes
Los siguientes casos de uso del flujo de trabajo de libros están pendientes de implementación:

- [ ] **CU02 - Registrar Condición**: Registrar el estado físico del libro (daños, condición)
- [ ] **CU03 - Restaurar Libro**: Proceso de restauración física del libro
- [ ] **CU04 - Digitalizar Libro**: Proceso de digitalización (escaneo, OCR)
- [ ] **CU05 - Clasificar Libro**: Asignar categoría y metadatos al libro
- [ ] **CU07 - Consultar Historial del Libro**: Ver el historial de cambios y procesos
- [ ] **CU08 - Generar Reporte**: Generar reportes sobre el catálogo de libros
- [ ] **CU15 - Control de Calidad Física**: Revisión de calidad física del libro
- [ ] **CU16 - Filtrar Libros por Estado**: Filtros avanzados por estado (ya parcialmente implementado)
- [ ] **CU19 - Asignar Tarea**: Asignar tareas de digitalización/restauración
- [ ] **CU23 - Descargar Libro**: Descargar PDF del libro digitalizado
- [ ] **CU24 - Control de Calidad Digital**: Revisión de calidad del PDF digitalizado
