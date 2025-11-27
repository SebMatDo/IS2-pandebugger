# IS2 Pandebugger - Backend API

> **Modular monolith backend API** built with Express.js, TypeScript, PostgreSQL, and Docker, ready for AWS deployment.

Educational project for book digitalization management, enabling the digitization workflow from physical books to searchable digital database.

---

## 📚 **Documentation**

Complete guides for setup, development, and deployment:

| Guide | Description |
|-------|-------------|
| **[🚀 Getting Started](./docs/GETTING_STARTED.md)** | **Start here!** Complete step-by-step setup guide from zero to running |
| **[🗄️ Database Guide](./docs/DATABASE_GUIDE.md)** | Database management, migrations, seeds, and pgAdmin |
| **[🧪 API Testing](./docs/API_TESTING.md)** | Testing with Postman, authentication, and all endpoints |
| **[☁️ AWS Deployment](./docs/AWS_DEPLOYMENT.md)** | Production deployment to AWS ECS + RDS |

---

## ⚡ **Quick Start**

```bash
# 1. Clone repository
git clone https://github.com/SebMatDo/IS2-pandebugger.git
cd IS2-pandebugger

# 2. Install dependencies
npm install

# 3. Start Docker containers (API + PostgreSQL + pgAdmin)
docker compose up -d

# 4. Load test data
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/001_seed_test_users.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/002_seed_test_books.sql
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < src/shared/database/seeds/003_seed_test_tasks.sql

# 5. Test the API
curl http://localhost:3000/api/v1/health
```

**Access Points:**
- 🌐 API: http://localhost:3000/api/v1
- 🎨 pgAdmin: http://localhost:5050 (admin@pandebugger.com / admin)
- 📊 Health Check: http://localhost:3000/api/v1/health

**Test Users** (password: `Test123!`):
- admin@pandebugger.com (Admin)
- maria.gonzalez@pandebugger.com (Bibliotecario)
- carlos.ramirez@pandebugger.com (Digitalizador)

👉 **For detailed instructions, see [Getting Started Guide](./docs/GETTING_STARTED.md)**

---

## 🏗️ **Architecture**

This project follows a **modular monolith** architecture where code is organized into independent modules, each with its own:
- **Routes**: API endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic
- **Types**: TypeScript interfaces and types

### Project Structure

```
src/
├── config/              # Application configuration
│   └── index.ts         # Environment variables and config loader
├── modules/             # Feature modules
│   ├── health/          # Health check endpoints
│   │   ├── health.controller.ts
│   │   └── health.routes.ts
│   └── books/           # Books module (example)
│       ├── books.controller.ts
│       ├── books.service.ts
│       ├── books.routes.ts
│       └── books.types.ts
├── shared/              # Shared utilities and middleware
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── requestLogger.ts
│   └── utils/           # Utility functions
│       └── response.ts  # Standard API response formatters
├── app.ts               # Express app setup
└── server.ts            # Server entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose (optional, for containerized development)

## 🏗️ **Architecture**

**Modular Monolith** - Code organized into independent, self-contained modules:

- **Routes**: API endpoint definitions
- **Controllers**: Request/response handling
- **Services**: Business logic and database operations
- **Types**: TypeScript interfaces and types
- **Middleware**: Authentication, logging, error handling

### **Tech Stack**

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Containerization**: Docker & Docker Compose
- **GUI Database**: pgAdmin 4
- **Production**: AWS ECS + RDS

### **Project Structure**

```
IS2-pandebugger/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication (JWT, login, passwords)
│   │   ├── books/           # Book management
│   │   └── health/          # Health check endpoints
│   ├── shared/
│   │   ├── database/        # Database migrations and seeds
│   │   │   ├── migrations/  # SQL schema migrations
│   │   │   └── seeds/       # Test data
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utility functions
│   ├── config/              # Configuration management
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── docs/                    # Documentation
│   ├── GETTING_STARTED.md   # Setup guide
│   ├── DATABASE_GUIDE.md    # Database management
│   ├── API_TESTING.md       # Postman testing guide
│   └── AWS_DEPLOYMENT.md    # Production deployment
├── scripts/                 # Utility scripts
├── docker-compose.yml       # Local development
├── Dockerfile              # Production image
└── package.json            # Dependencies and scripts
```

---

## 📦 **Available Scripts**

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production build

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode (development)
npm run test:coverage    # Run tests with coverage report
npm run test:verbose     # Run tests with detailed output
npm run test:auth        # Run only authentication tests

# Docker
npm run docker:up        # Start all containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:clean     # Stop and remove volumes (⚠️ deletes data)

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Load test data
npm run db:reset         # Migrate + seed

# Code Quality
npm run lint             # Lint code with ESLint
npm run format           # Format code with Prettier
```

---

##  **API Endpoints**

### **Health Checks**
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/readiness` - Database connectivity check

### **Authentication**
- `POST /api/v1/auth/login` - Login (get JWT token)
- `GET /api/v1/auth/me` - Get current user (requires auth)
- `POST /api/v1/auth/change-password` - Change password (requires auth)

### **Books** (TODO)
- `GET /api/v1/books` - List books
- `GET /api/v1/books/:id` - Get book by ID
- `POST /api/v1/books` - Create book
- `PUT /api/v1/books/:id` - Update book
- `DELETE /api/v1/books/:id` - Delete book

👉 **Full API documentation: [API Testing Guide](./docs/API_TESTING.md)**

---

## 🐳 **Docker Environment**

### **Services**

- **app** - Backend API (Node.js + Express)
- **postgres** - PostgreSQL 15 database
- **pgadmin** - pgAdmin 4 web interface

### **Volumes**

- `postgres_data` - Persistent database storage
- `pgadmin_data` - pgAdmin configuration

### **Networks**

- `pandebugger-network` - Internal Docker network

### **Useful Commands**

```bash
# View running containers
docker compose ps

# View logs
docker compose logs -f app          # Backend logs
docker compose logs -f postgres     # Database logs
docker compose logs -f              # All logs

# Restart a service
docker compose restart app

# Access PostgreSQL shell
docker exec -it pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev

# Execute SQL file
docker exec -i pandebugger-postgres psql -U pandebugger_user -d pandebugger_dev < file.sql
```

---

## 🗄️ **Database**

### **Schema**

- `usuarios` - System users
- `roles` - User roles (Admin, Bibliotecario, etc.)
- `libros` - Books catalog
- `estados_libro` - Book workflow states
- `categoria` - Book categories
- `tareas` - Assigned tasks
- `historial` - Audit log
- `accion` - Action types
- `target_type` - Audit target types

### **Migrations**

Migrations are SQL files that define database schema changes:

```
src/shared/database/migrations/
├── 001_initial_schema.sql           # Create all tables
└── 002_seed_reference_data.sql      # Insert reference data
```

Migrations run automatically on first container startup.

### **Seeds (Test Data)**

Seeds populate the database with sample data for development:

```
src/shared/database/seeds/
├── 001_seed_test_users.sql     # 5 test users
├── 002_seed_test_books.sql     # 10 sample books
└── 003_seed_test_tasks.sql     # 3 assigned tasks
```

👉 **Full database documentation: [Database Guide](./docs/DATABASE_GUIDE.md)**

---

## 🔐 **Authentication**

### **JWT Token-based Authentication**

- **Algorithm**: HS256 (HMAC with SHA-256)
- **Expiration**: 7 days (configurable)
- **Password Hashing**: bcrypt (10 rounds)

### **Test Credentials**

All test users use password: **`Test123!`**

| Email | Role | Description |
|-------|------|-------------|
| admin@pandebugger.com | Admin | Full system access |
| maria.gonzalez@pandebugger.com | Bibliotecario | Manage books and users |
| carlos.ramirez@pandebugger.com | Digitalizador | Digitize books |
| ana.martinez@pandebugger.com | Revisor | Quality review |
| luis.fernandez@pandebugger.com | Restaurador | Physical restoration |

### **Example Login**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pandebugger.com","password":"Test123!"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@pandebugger.com",
      "rol_nombre": "Admin"
    }
  }
}
```

### **Using the Token**

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

👉 **Full authentication guide: [API Testing Guide](./docs/API_TESTING.md)**

---

## ☁️ **Deployment**

### **Production Architecture**

```
AWS Cloud
├── ECS Fargate          # Backend API containers
├── RDS PostgreSQL       # Managed database
├── Application Load Balancer
├── ECR                  # Container registry
└── Secrets Manager      # Credentials storage
```

### **Deployment Steps**

1. Create RDS PostgreSQL instance
2. Build and push Docker image to ECR
3. Create ECS cluster and task definition
4. Configure Application Load Balancer
5. Deploy ECS service
6. Run database migrations on RDS

👉 **Full deployment guide: [AWS Deployment](./docs/AWS_DEPLOYMENT.md)**

---

## 🧪 **Testing**

### **Manual Testing with Postman**

1. Import collection from `docs/API_TESTING.md`
2. Set environment variables
3. Run authentication flow
4. Test protected endpoints

### **Automated Testing** (TODO)

```bash
npm test                 # Run test suite
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

---

## 📝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test locally: `docker compose up`
5. Commit changes: `git commit -am 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create Pull Request

---

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) file

---

## 🔗 **Links**

- **Repository**: https://github.com/SebMatDo/IS2-pandebugger
- **Issues**: https://github.com/SebMatDo/IS2-pandebugger/issues
- **Documentation**: [docs/](./docs/)

---

## 🆘 **Need Help?**

1. Check the [Getting Started Guide](./docs/GETTING_STARTED.md)
2. Review [Troubleshooting](./docs/GETTING_STARTED.md#solución-de-problemas)
3. Check Docker logs: `docker compose logs -f`
4. Open an issue on GitHub

---

**Made with ❤️ for IS2 - Universidad Nacional de Colombia**
