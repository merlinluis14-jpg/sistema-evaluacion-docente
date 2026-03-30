ALTER TABLE "CareerHeadEvaluation"
ADD COLUMN "careerId" TEXT;

UPDATE "CareerHeadEvaluation" AS che
SET "careerId" = t."careerId"
FROM "Teacher" AS t
WHERE che."teacherId" = t."id"
  AND che."careerId" IS NULL;

ALTER TABLE "CareerHeadEvaluation"
ALTER COLUMN "careerId" SET NOT NULL;

ALTER TABLE "CareerHeadEvaluation"
ADD CONSTRAINT "CareerHeadEvaluation_careerId_fkey"
FOREIGN KEY ("careerId") REFERENCES "Career"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

DROP INDEX IF EXISTS "CareerHeadEvaluation_periodId_teacherId_idx";
DROP INDEX IF EXISTS "CareerHeadEvaluation_teacherId_periodId_key";

CREATE INDEX "CareerHeadEvaluation_careerId_periodId_idx"
ON "CareerHeadEvaluation"("careerId", "periodId");

CREATE INDEX "CareerHeadEvaluation_periodId_teacherId_careerId_idx"
ON "CareerHeadEvaluation"("periodId", "teacherId", "careerId");

CREATE UNIQUE INDEX "CareerHeadEvaluation_teacherId_careerId_periodId_key"
ON "CareerHeadEvaluation"("teacherId", "careerId", "periodId");
