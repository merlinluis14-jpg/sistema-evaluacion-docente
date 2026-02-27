/*
  Warnings:

  - You are about to drop the column `autoEvalAvg` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `comentarios` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `facilitadorAvg` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `habilidadesAvg` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `mediosAvg` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentId,subjectId,periodId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `periodId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- Limpiar datos de evaluaciones de prueba del esquema anterior
DELETE FROM "Evaluation";

-- DropIndex
DROP INDEX "Evaluation_studentId_subjectId_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "autoEvalAvg",
DROP COLUMN "comentarios",
DROP COLUMN "facilitadorAvg",
DROP COLUMN "habilidadesAvg",
DROP COLUMN "mediosAvg",
ADD COLUMN     "auto_item01" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item02" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item03" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item04" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item05" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item06" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item07" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item08" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item09" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item10" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "auto_item11" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "comentario_adicional" TEXT,
ADD COLUMN     "comentario_fortalezas" TEXT,
ADD COLUMN     "fac_item01" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item02" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item03" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item04" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item05" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item06" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item07" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item08" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item09" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item10" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fac_item11" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hab_item01" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hab_item02" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hab_item03" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hab_item04" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item01" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item02" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item03" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item04" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item05" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "med_item06" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "periodId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_studentId_subjectId_periodId_key" ON "Evaluation"("studentId", "subjectId", "periodId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
