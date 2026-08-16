# ──────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
# prisma-ms-perfil-alumno — NestJS 11 + Prisma 5 (Student + PaciProfile)  →  :3005
# Multi-stage: (1) build (compila TS + genera cliente Prisma), (2) runtime slim.
#
# A diferencia de los otros microservicios, aquí `prisma` está en dependencies,
# por lo que el CLI SÍ queda disponible en la imagen runtime y podrías correr
# `npx prisma migrate deploy` desde el contenedor si lo necesitas.
=======
# prisma-ms-perfil-alumno — NestJS 11 + Prisma 5 (perfil alumno)  →  :3000
# Multi-stage: (1) build (compila TS + genera cliente Prisma), (2) runtime slim.
#
# Las migraciones NO corren aquí (prisma CLI vive en devDependencies y la imagen
# runtime solo trae deps de producción). Ejecútalas como paso aparte del deploy:
#   npx prisma migrate deploy   (en CI o en una task one-off de ECS)
>>>>>>> a54ef66f568ee18d5f8b3d8ea5ff4206febb2a27
# ──────────────────────────────────────────────────────────────────────────

# Stage 1: build
FROM node:20-alpine AS builder

# openssl + libc6-compat: requeridos por el query engine de Prisma en Alpine (musl)
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi

COPY . .

<<<<<<< HEAD
=======
# Genera el cliente Prisma para el target musl (corre dentro del contenedor Alpine)
>>>>>>> a54ef66f568ee18d5f8b3d8ea5ff4206febb2a27
RUN npx prisma generate
RUN npm run build

# Stage 2: runtime
FROM node:20-alpine AS runtime

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev --no-audit --no-fund; fi \
    && npm cache clean --force

<<<<<<< HEAD
=======
# Artefactos del build: JS compilado, schema/migraciones y cliente Prisma generado
>>>>>>> a54ef66f568ee18d5f8b3d8ea5ff4206febb2a27
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
<<<<<<< HEAD
ENV PORT=3005

USER node

EXPOSE 3005

CMD ["node", "dist/src/main.js"]
=======
ENV PORT=3000

# Ejecutar como usuario sin privilegios (incluido en la imagen oficial de node)
USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
>>>>>>> a54ef66f568ee18d5f8b3d8ea5ff4206febb2a27
