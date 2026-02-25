/*
  Warnings:

  - You are about to drop the column `autoevaluacion` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `facilitadorScore` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `habilidadesScore` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `mediosScore` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `teoriaPractica` on the `Evaluation` table. All the data in the column will be lost.
  - Added the required column `clarity` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fairness` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `feedback` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledge` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `methodology` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `punctuality` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "autoevaluacion",
DROP COLUMN "facilitadorScore",
DROP COLUMN "habilidadesScore",
DROP COLUMN "mediosScore",
DROP COLUMN "teoriaPractica",
ADD COLUMN     "clarity" INTEGER NOT NULL,
ADD COLUMN     "fairness" INTEGER NOT NULL,
ADD COLUMN     "feedback" INTEGER NOT NULL,
ADD COLUMN     "knowledge" INTEGER NOT NULL,
ADD COLUMN     "methodology" INTEGER NOT NULL,
ADD COLUMN     "punctuality" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
