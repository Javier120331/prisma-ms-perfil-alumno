export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/prisma_perfil_alumno',
};

export const supabaseConfig = {
  jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
};

export const appConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
};
