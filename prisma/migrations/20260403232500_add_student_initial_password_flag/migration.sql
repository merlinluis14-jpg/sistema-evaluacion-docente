ALTER TABLE "User"
ADD COLUMN "canChangeInitialPassword" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "canChangeInitialPassword" = true
WHERE "role" = 'ALUMNO';
