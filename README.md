# Microservicio de Perfil de Alumno

Microservicio stateless construido con NestJS + TypeScript + Prisma para gestionar perfiles de estudiantes y documentos PACI con autenticación JWT de Supabase.

## Características

- **Arquitectura Stateless**: Diseñado para escalabilidad horizontal sin retención de estado en memoria
- **Base de Datos por Servicio**: Patrón Database per Service con Prisma ORM
- **Autenticación JWT**: Validación de tokens de Supabase en cada request
- **API REST**: Endpoints completos para CRUD de estudiantes y perfiles PACI
- **Importación Masiva**: Soporte para importación de estudiantes desde archivos PDF
- **Docker Ready**: Contenedor optimizado para despliegue en Amazon ECR

## Tecnologías

- NestJS (Framework)
- TypeScript
- Prisma ORM
- PostgreSQL (configurable para AWS RDS o Maiven)
- Supabase JWT Authentication
- Docker

## Estructura del Proyecto

```
src/
├── main.ts                          # Punto de entrada (puerto 3000)
├── app.module.ts                    # Módulo raíz
├── config/
│   └── database.config.ts           # Configuración de BD
├── common/
│   ├── guards/
│   │   └── supabase-jwt.guard.ts    # Guard JWT Supabase
│   └── services/
│       └── prisma.service.ts        # Servicio Prisma
├── modules/
│   ├── student/                     # Módulo de Estudiantes
│   │   ├── dto/
│   │   ├── student.controller.ts
│   │   └── student.service.ts
│   └── paci-profile/                # Módulo de Perfiles PACI
│       ├── dto/
│       ├── paci-profile.controller.ts
│       └── paci-profile.service.ts
└── prisma/
    └── schema.prisma                # Esquema de BD
```

## Configuración

### Variables de Entorno

Cree un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
SUPABASE_JWT_SECRET="your-supabase-jwt-secret"
PORT=3000
NODE_ENV=development
```

### Instalación

```bash
npm install
```

### Generar Cliente Prisma

```bash
npx prisma generate
```

### Migraciones de Base de Datos

```bash
# Crear migración
npx prisma migrate dev --name init

# Aplicar migraciones en producción
npx prisma migrate deploy
```

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## API Endpoints

### Estudiantes

Todos los endpoints requieren token JWT de Supabase en el header `Authorization: Bearer <token>`

- `POST /students` - Crear estudiante
- `GET /students` - Listar todos los estudiantes
- `GET /students/:id` - Obtener estudiante por ID
- `GET /students/user/:userId` - Obtener estudiante por user_id de Supabase
- `PATCH /students/:id` - Actualizar estudiante
- `DELETE /students/:id` - Eliminar estudiante
- `POST /students/import` - Importar estudiantes desde PDF (multipart/form-data)

### Perfiles PACI

- `POST /paci-profiles` - Crear perfil PACI
- `GET /paci-profiles` - Listar todos los perfiles
- `GET /paci-profiles/:id` - Obtener perfil por ID
- `GET /paci-profiles/student/:studentId` - Listar perfiles de un estudiante
- `PATCH /paci-profiles/:id` - Actualizar perfil
- `DELETE /paci-profiles/:id` - Eliminar perfil

## Docker

### Construir Imagen

```bash
docker build -t prisma-ms-perfil-alumno .
```

### Ejecutar Contenedor

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e SUPABASE_JWT_SECRET="..." \
  prisma-ms-perfil-alumno
```

### Push a Amazon ECR

```bash
# Login a ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag imagen
docker tag prisma-ms-perfil-alumno:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/prisma-ms-perfil-alumno:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/prisma-ms-perfil-alumno:latest
```

## Entidades de Base de Datos

### Student
- `student_id`: UUID (primary key)
- `user_id`: UUID (referencia Supabase, unique)
- `rut`: String
- `nombre`: String
- `apellido`: String
- `curso`: String
- `establecimiento`: String
- Timestamps: createdAt, updatedAt

### PACI Profile
- `paci_id`: UUID (primary key)
- `student_id`: UUID (foreign key → Student)
- `fecha_diagnostico`: DateTime
- `nee`: String (NEE - Necesidades Educativas Especiales)
- `descripcion_incapacidad`: String (TEA, TDHA, etc.)
- `observaciones`: String (opcional)
- Timestamps: createdAt, updatedAt

**Relación**: Student (1) ←→ (N) PACI Profile

## Seguridad

- Validación de JWT de Supabase en cada request protegido
- Extracción y validación de `user_id` del token
- Estructura extensible para futuras validaciones (role, email_verified, etc.)

## Notas

- La importación masiva desde PDF requiere implementación personalizada según el formato del documento
- El servicio es stateless y no retiene información de sesión en memoria
- Configurado para trabajar con PostgreSQL local, AWS RDS o Maiven
