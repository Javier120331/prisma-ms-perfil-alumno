ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "colegio_id" TEXT;

CREATE INDEX IF NOT EXISTS "Student_colegio_id_idx" ON "Student"("colegio_id");
