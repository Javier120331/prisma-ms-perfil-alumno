/*
  Warnings:

  - You are about to drop the column `apoderado` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "apoderado",
DROP COLUMN "direccion";
