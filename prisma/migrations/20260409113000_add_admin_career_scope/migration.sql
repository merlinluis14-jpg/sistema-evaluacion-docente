-- Add support for global admins and admins restricted to specific careers.
ALTER TABLE "User"
ADD COLUMN "adminHasGlobalScope" BOOLEAN NOT NULL DEFAULT false;

-- Preserve current behavior for existing administrative accounts.
UPDATE "User"
SET "adminHasGlobalScope" = true
WHERE "role" = 'ADMIN';

CREATE TABLE "AdminCareerAccess" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "careerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminCareerAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminCareerAccess_userId_careerId_key" ON "AdminCareerAccess"("userId", "careerId");
CREATE INDEX "AdminCareerAccess_careerId_userId_idx" ON "AdminCareerAccess"("careerId", "userId");

ALTER TABLE "AdminCareerAccess"
ADD CONSTRAINT "AdminCareerAccess_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminCareerAccess"
ADD CONSTRAINT "AdminCareerAccess_careerId_fkey"
FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;
