export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prisma_perfil_alumno',
};

export const appConfig = {
  port: process.env.PORT || 3005,
  env: process.env.NODE_ENV || 'development',
};
