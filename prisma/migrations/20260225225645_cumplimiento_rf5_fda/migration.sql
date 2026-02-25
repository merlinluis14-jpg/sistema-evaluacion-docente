/*
  Warnings:

  - You are about to drop the column `clarity` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `fairness` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `knowledge` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `methodology` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `punctuality` on the `Evaluation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "clarity",
DROP COLUMN "fairness",
DROP COLUMN "feedback",
DROP COLUMN "knowledge",
DROP COLUMN "methodology",
DROP COLUMN "punctuality",
ADD COLUMN     "autoEvalAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "facilitadorAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "habilidadesAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "mediosAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "teoriaPractica" INTEGER NOT NULL DEFAULT 0;
