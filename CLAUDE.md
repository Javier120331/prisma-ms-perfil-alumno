# CLAUDE.md — prisma-ms-perfil-alumno

> Contexto interno para sesiones de Claude Code trabajando en **este repo**. Para el mapa general del
> sistema P.R.I.S.M.A. (otros repos, flujos, decretos), ver el `CLAUDE.md` en la raíz del workspace `EP2/`.

## 1. Rol del repo

Microservicio NestJS que administra la **fuente de datos estructurada del alumno**: `Student` (ficha básica)
y `PaciProfile` (perfil PACI estructurado, en JSON, con vigencia). Es **distinto** del documento PACI crudo
(PDF) que se sube en el flujo de chat de `prisma_workflow`: acá el dato ya está parseado/estructurado en
`datosEstructurales`, no es un archivo.

El motor de IA (`prisma_workflow`) y el front (`paciService.js`) consumen este servicio para leer
diagnóstico y vigencia del informe — dato relevante para los *compliance gates* del Decreto 170 (vigencia
~20 meses) y 83, aunque **la validación normativa en sí no vive en este repo**: acá solo se persisten y
exponen los datos.

Puerto: **3005** (definido en `.env` / `Dockerfile`, ver §9 sobre inconsistencias).

## 2. Stack y estructura

- **NestJS 11** + TypeScript, **Prisma 5** (`@prisma/client` ^5.22, esquema **por defecto**, sin
  `multiSchema` — a diferencia de `ms-users`/`ms-docs`).
- Autenticación: **JWT de Supabase validado vía JWKS con `jose`** (no crea usuarios, no tiene
  `SUPABASE_SERVICE_ROLE_KEY`).
- Importación PDF: librería **`pdf-parse`**.
- Validación de DTOs: `class-validator` + `class-transformer`, `ValidationPipe` global
  (`whitelist: true, forbidNonWhitelisted: true, transform: true` — ver `src/main.ts`).

```
src/
├── main.ts                              # bootstrap, CORS, ValidationPipe, listen(PORT)
├── app.module.ts                        # importa StudentModule + PaciProfileModule
├── app.controller.ts                    # GET / , GET /health
├── config/
│   └── database.config.ts               # ⚠️ código muerto, ver §9
├── common/
│   ├── guards/supabase-jwt.guard.ts     # valida JWT contra JWKS de Supabase
│   ├── services/prisma.service.ts       # PrismaClient con onModuleInit/Destroy
│   └── utils/tenancy.util.ts            # resolveColegioId / assertColegioAccess (multi-tenant)
└── modules/
    ├── student/
    │   ├── student.controller.ts        # CRUD + /students/import (PDF)
    │   ├── student.service.ts           # lógica + parseo PDF
    │   └── dto/{create,update}-student.dto.ts
    └── paci-profile/
        ├── paci-profile.controller.ts   # CRUD + /filter /active /historical /recent
        ├── paci-profile.service.ts
        └── dto/{create,update}-paci-profile.dto.ts
```

`prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts` (script `npm run prisma db seed` vía
`"prisma": {"seed": "ts-node prisma/seed.ts"}` en `package.json`).

## 3. Modelo de datos (Prisma real — `prisma/schema.prisma`)

```prisma
model Student {
  id              String   @id @default(uuid())
  userId          String                     // uid de Supabase (dueño del registro, NO unique en BD)
  colegioId       String?  @map("colegio_id") // tenant; nullable a nivel de esquema
  nombreCompleto  String
  fechaNacimiento DateTime
  cursoActual     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  paciProfiles    PaciProfile[]

  @@index([colegioId])
  @@index([userId])
}

model PaciProfile {
  id                 String   @id @default(uuid())
  studentId          String
  userId             String
  diagnostico        String   // texto libre, SIN enum/catálogo de categorías (ver §9)
  fechaElaboracion   DateTime
  fechaRevision      DateTime
  duracion           String
  validFrom          DateTime
  validUntil         DateTime // vigencia del informe — clave para el gate del Decreto 170
  datosEstructurales Json     // JSON libre: áreas cognitivas, fortalezas, debilidades, recomendaciones
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  student            Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

Notas frente a lo documentado en otros lados del sistema:
- **No existen** los campos `rut`, `apellido`, `establecimiento` ni `nee`/`descripcion_incapacidad`/
  `observaciones` que menciona el `README.md` de este repo — están obsoletos (ver §9). El campo real de
  diagnóstico es `diagnostico: String` en `PaciProfile`.
- `Student` tuvo antes `direccion`/`apoderado` (migración `remove_student_address_guardian`) — eliminados.
- `colegioId` se agregó después (migración `add_colegio_id_to_student`) y **solo existe en `Student`**,
  no en `PaciProfile` directamente: el scoping por colegio en `PaciProfile` se hace vía `student.colegioId`
  (join), ver `paci-profile.service.ts`.
- `datosEstructurales` no tiene forma fija a nivel de Prisma (`Json`); el DTO solo exige `@IsObject()`.

## 4. Endpoints

Todos bajo guard `SupabaseJwtGuard` (requieren `Authorization: Bearer <jwt>`), excepto `GET /` y
`GET /health`.

### `/students` (`student.controller.ts`)
| Método | Ruta | Notas |
|---|---|---|
| POST | `/students` | body: `CreateStudentDto` |
| GET | `/students` | lista scoped por `userId` (+`colegioId` si aplica) |
| GET | `/students/me` | busca por `userId` del token (primer match) |
| GET | `/students/:id` | incluye `paciProfiles` |
| PATCH | `/students/:id` | `UpdateStudentDto` (PartialType) |
| DELETE | `/students/:id` | |
| POST | `/students/import` | `multipart/form-data`, campo `file`, PDF. Ver §6 |

### `/paci-profiles` (`paci-profile.controller.ts`)
| Método | Ruta | Notas |
|---|---|---|
| POST | `/paci-profiles` | valida que el `studentId` pertenezca al `userId`/`colegioId` del token |
| GET | `/paci-profiles` | todos los del usuario |
| GET | `/paci-profiles/filter` | query: `studentId, isActive, curso, fromDate, toDate` |
| GET | `/paci-profiles/active` | `validFrom <= now <= validUntil` |
| GET | `/paci-profiles/historical` | `validUntil < now` |
| GET | `/paci-profiles/recent` | query `limit` (default 10) |
| GET | `/paci-profiles/:id` | |
| GET | `/paci-profiles/student/:studentId` | perfiles de un estudiante |
| PATCH | `/paci-profiles/:id` | |
| DELETE | `/paci-profiles/:id` | |

⚠️ Rutas con parámetros literales (`filter`, `active`, `historical`, `recent`, `me`) están declaradas
**antes** de las rutas `:id` genéricas en cada controller — orden correcto en Nest para que no colisionen
con `GET /:id`.

## 5. Autenticación JWT y multi-tenant (`colegioId`)

- `SupabaseJwtGuard` (`src/common/guards/supabase-jwt.guard.ts`) valida el JWT contra
  `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` con `jose` (`createRemoteJWKSet` + `jwtVerify`,
  `audience: 'authenticated'`). Solo necesita `SUPABASE_URL` (`configService.getOrThrow`, así que si falta
  la app **no arranca**).
- Puebla `request.user = { id, email, role, appRole, colegioId }`, donde `appRole` y `colegioId` salen de
  `app_metadata` del JWT (no de `user_metadata` ni de una tabla propia — este servicio no tiene tabla de
  usuarios).
- **Tenancy** (`src/common/utils/tenancy.util.ts`):
  - `resolveColegioId(user)`: si el rol es `SUPERADMIN`, retorna `null` (acceso cross-colegio). Para
    cualquier otro rol, **si el token no trae `colegioId` en `app_metadata`, lanza `403 Forbidden`** — no
    hay fallback silencioso ("soft-fail" explícitamente evitado, ver comentario en el código).
  - `assertColegioAccess(user, targetColegioId)`: usada implícitamente vía las comparaciones manuales en
    los services (`if (colegioId && recurso.colegioId !== colegioId) throw ForbiddenException`).
  - Todos los endpoints de `student` y `paci-profile` filtran primero por `userId` (dueño del recurso) y
    luego por `colegioId` si corresponde — es decir, el scoping es doble: por usuario Y por colegio.
- Quién consume este servicio: `prisma-front` vía `paciService.js` (`VITE_API_PERFIL_ALUMNO_URL`), y
  potencialmente `prisma_workflow` para leer diagnóstico/vigencia en las validaciones de compliance
  (llamada server-to-server, no vista en este repo).
- No se encontraron referencias a un BFF (`bff-prisma` :3010) en este repo — si en el futuro el front deja
  de llamar directo a `:3005` y pasa por un BFF, actualizar esta sección y el guard de CORS.

## 6. Importación masiva desde PDF (`POST /students/import`)

Implementación real en `student.service.ts::importFromPdf` — **es un parser muy simple, no un extractor
PACI robusto**:

1. Recibe el PDF como `Buffer` (multipart, campo `file`, sin `FileInterceptor` limits configurados → sin
   límite explícito de tamaño en este repo, a diferencia de `ms-docs` que sí tiene
   `JOB_UPLOAD_MAX_SIZE_MB`).
2. Extrae texto plano con `pdf-parse` (`pdfParse(buffer)` → `data.text`).
3. Divide el texto en líneas y **solo procesa líneas que contengan literalmente `"RUT:"` o `"rut:"`**.
4. Por cada línea candidata, `parseStudentLine` hace `line.split(/[,;|]/)` y asume un orden posicional fijo:
   `parts[1]` → `nombreCompleto`, `parts[2]` → `fechaNacimiento`, `parts[3]` → `cursoActual` (¡`parts[0]`,
   presumiblemente el RUT, se descarta — **no se persiste el RUT en ningún campo**, coherente con que
   `Student` ya no tiene columna `rut`!).
5. Inserta con `prisma.student.createMany({ skipDuplicates: true })`, asignando `userId`/`colegioId` del
   token a **todos** los estudiantes importados.
6. Si `pdf-parse` falla (PDF corrupto, cifrado, escaneado sin texto, etc.) se relanza como `Error` genérico
   (`500`), no hay manejo diferenciado ni validación de formato/estructura del PDF.

Implicación práctica: el formato esperado es texto plano tipo CSV con delimitador `,`/`;`/`|` y una línea
por alumno que contenga la palabra `RUT:` — no soporta PDFs escaneados (sin capa de texto) ni tablas reales
extraídas por posición/columnas. Cualquier cambio al formato de PACI de origen probablemente rompe este
parser silenciosamente (líneas que no matchean simplemente se ignoran, sin reportar cuántas se
descartaron).

## 7. Variables de entorno (`.env.example`)

```env
PORT=3005
CORS_ORIGIN=http://localhost:3002,http://127.0.0.1:3002

DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Solo SUPABASE_URL es necesaria para validar JWT via JWKS (jose).
# Los microservicios NO deben tener SUPABASE_ANON_KEY ni SUPABASE_SERVICE_ROLE_KEY.
SUPABASE_URL=https://your-project.supabase.co
```

- `main.ts` carga `.env` explícitamente con `dotenv.config({ path: path.resolve(__dirname, '..', '.env') })`
  antes de crear la app Nest (no depende solo de `@nestjs/config`).
- `CORS_ORIGIN` se parsea a lista (split por coma); si no está seteada cae a
  `['http://localhost:3002', 'http://127.0.0.1:3002']` por defecto.
- El `.env` real de desarrollo (no versionado) trae además `SUPABASE_ANON_KEY` y
  `SUPABASE_SERVICE_ROLE_KEY` — **no son usadas por el código** (el guard solo lee `SUPABASE_URL`); son
  resabios de copiar el `.env` de otro servicio. No agregarlas al `.env.example` ni depender de ellas.

## 8. Comandos

```bash
npm install
npx prisma generate
npx prisma migrate dev --name <nombre>     # crea migración en desarrollo
npx prisma migrate deploy                  # aplica migraciones (producción)
npx prisma db seed                         # corre prisma/seed.ts (dos alumnos + PaciProfile de ejemplo)

npm run start:dev      # watch mode (alias: npm run dev)
npm run start:prod      # node dist/main  (⚠️ ver §9, el Dockerfile usa dist/src/main.js)
npm run build           # nest build
npm run lint             # eslint --fix
npm run format            # prettier --write

npm test                 # Jest (unit, *.spec.ts junto al código)
npm run test:watch
npm run test:cov
npm run test:e2e         # jest --config ./test/jest-e2e.json (test/app.e2e-spec.ts)

# Docker
docker compose up --build   # solo levanta Postgres local (docker-compose.yml no incluye el propio servicio)
docker build -t prisma-ms-perfil-alumno .
```

CI: `.github/workflows/deploy-ecr.yml` — build & push a Amazon ECR en cada push a `main` (repo
`prisma-ms-perfil-alumno`), usando credenciales temporales de AWS Academy (`AWS_SESSION_TOKEN` incluido).

## 9. Gotchas / discrepancias encontradas en el código

- **`README.md` desactualizado**: describe un modelo `Student` con `rut`, `apellido`, `establecimiento` y
  un `PaciProfile` con `nee`/`descripcion_incapacidad`/`observaciones`, puerto `3000` y
  `SUPABASE_JWT_SECRET`. Nada de eso existe en el `schema.prisma` ni en el código actual — confiar en este
  `CLAUDE.md` y en `prisma/schema.prisma`, no en el README, hasta que alguien lo actualice.
- **`src/config/database.config.ts` es código muerto**: exporta `databaseConfig`, `supabaseConfig`
  (con `SUPABASE_JWT_SECRET`, que ya no se usa) y `appConfig` (puerto default `3000`), pero **no lo importa
  nadie** fuera de su propio `.spec.ts`. La config real vive inline en `main.ts` (`process.env.PORT`,
  `process.env.CORS_ORIGIN`) y en el guard (`ConfigService.getOrThrow('SUPABASE_URL')`). Si se va a tocar
  configuración, no asumir que pasa por este archivo.
- **Mismatch `start:prod` vs Dockerfile**: `package.json` define `start:prod` como `node dist/main`, pero
  el `Dockerfile` (multi-stage, runtime `node:20-alpine`) ejecuta `node dist/src/main.js` (coherente con
  `sourceRoot: "src"` en `nest-cli.json`, que genera `dist/src/...`). `npm run start:prod` local
  probablemente falla si se corre tal cual sobre un build limpio — usar `node dist/src/main.js` o ajustar el
  script.
- **`diagnostico` es texto libre, sin catálogo/enum**: no hay ningún enum ni lista de categorías NEE
  reconocidas (D170) hardcodeada en este repo — a diferencia de lo que se podría esperar. La validación de
  "categoría diagnóstica reconocida" para compliance debe estar (o debería estar) del lado de
  `prisma_workflow`, no acá; este servicio solo persiste el string.
- **`resolveColegioId` es estricto por diseño**: cualquier usuario no-`SUPERADMIN` sin `colegioId` en
  `app_metadata` del JWT recibe `403` en **todos** los endpoints (excepto `GET /students/me`, que no llama
  `resolveColegioId` y solo filtra por `userId`). Si se prueban tokens de desarrollo sin `app_metadata.
  colegioId`, todo excepto `/students/me` fallará con Forbidden.
- **`POST /students/import` no valida tamaño ni tipo MIME del archivo** (`FileInterceptor('file')` sin
  opciones), y asigna el mismo `userId`/`colegioId` del token a todos los estudiantes detectados en el PDF,
  sin deduplicar contra estudiantes ya existentes salvo por `skipDuplicates` de Prisma (que solo aplica a
  colisiones de constraint único — `Student.id` es autogenerado, así que en la práctica `skipDuplicates`
  rara vez evita duplicados reales por nombre/fecha repetidos).
- **`docker-compose.yml` no levanta el propio microservicio**, solo un Postgres local (`prisma-perfil-alumno-db`,
  puerto 5432) para desarrollo; el despliegue real es imagen suelta a ECR (`deploy-ecr.yml`) + orquestación
  en ECS fuera de este repo.
- **`Student.userId` no es `@unique`** en el schema (a pesar de que `GET /students/me` y
  `findByUserId` asumen "un alumno por profesor" usando `findFirst`) — si un mismo `userId` llega a tener
  más de un `Student`, `/students/me` devuelve arbitrariamente el primero que encuentre Prisma.
