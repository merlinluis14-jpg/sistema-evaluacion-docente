CREATE TABLE IF NOT EXISTS "CareerHeadEvaluation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "careerId" TEXT,
    "periodId" TEXT NOT NULL,
    "evaluatorName" TEXT,
    "comments" TEXT,
    "planCourseScore" DOUBLE PRECISION,
    "competencyEvalScore" DOUBLE PRECISION,
    "researchScore" DOUBLE PRECISION,
    "tutoringScore" DOUBLE PRECISION,
    "advisoryScore" DOUBLE PRECISION,
    "platformUsageScore" DOUBLE PRECISION,
    "problemSolvingScore" DOUBLE PRECISION,
    "punctualityScore" DOUBLE PRECISION,
    "teamworkScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareerHeadEvaluation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CareerHeadEvaluation"
ADD COLUMN IF NOT EXISTS "careerId" TEXT;

UPDATE "CareerHeadEvaluation" AS che
SET "careerId" = t."careerId"
FROM "Teacher" AS t
WHERE che."teacherId" = t."id"
  AND che."careerId" IS NULL;

ALTER TABLE "CareerHeadEvaluation"
ALTER COLUMN "careerId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CareerHeadEvaluation_teacherId_fkey'
  ) THEN
    ALTER TABLE "CareerHeadEvaluation"
    ADD CONSTRAINT "CareerHeadEvaluation_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CareerHeadEvaluation_careerId_fkey'
  ) THEN
    ALTER TABLE "CareerHeadEvaluation"
    ADD CONSTRAINT "CareerHeadEvaluation_careerId_fkey"
    FOREIGN KEY ("careerId") REFERENCES "Career"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'CareerHeadEvaluation_periodId_fkey'
  ) THEN
    ALTER TABLE "CareerHeadEvaluation"
    ADD CONSTRAINT "CareerHeadEvaluation_periodId_fkey"
    FOREIGN KEY ("periodId") REFERENCES "Period"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE;
  END IF;
END $$;

DROP INDEX IF EXISTS "CareerHeadEvaluation_periodId_teacherId_idx";
DROP INDEX IF EXISTS "CareerHeadEvaluation_teacherId_periodId_key";

CREATE INDEX IF NOT EXISTS "CareerHeadEvaluation_careerId_periodId_idx"
ON "CareerHeadEvaluation"("careerId", "periodId");

CREATE INDEX IF NOT EXISTS "CareerHeadEvaluation_periodId_teacherId_careerId_idx"
ON "CareerHeadEvaluation"("periodId", "teacherId", "careerId");

CREATE UNIQUE INDEX IF NOT EXISTS "CareerHeadEvaluation_teacherId_careerId_periodId_key"
ON "CareerHeadEvaluation"("teacherId", "careerId", "periodId");
