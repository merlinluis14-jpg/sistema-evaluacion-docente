-- Career external metadata
ALTER TABLE "Career"
ADD COLUMN "externalId" INTEGER;

CREATE UNIQUE INDEX "Career_externalId_key" ON "Career"("externalId");

-- Teacher external metadata
ALTER TABLE "Teacher"
ADD COLUMN "externalId" INTEGER,
ADD COLUMN "externalUsername" TEXT,
ADD COLUMN "managedByExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastExternalSyncAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Teacher_externalId_key" ON "Teacher"("externalId");

-- Group external metadata
ALTER TABLE "Group"
ADD COLUMN "externalId" INTEGER,
ADD COLUMN "externalCode" TEXT,
ADD COLUMN "shift" TEXT,
ADD COLUMN "cuatrimestre" INTEGER,
ADD COLUMN "managedByExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastExternalSyncAt" TIMESTAMP(3);

CREATE INDEX "Group_externalId_period_idx" ON "Group"("externalId", "period");

-- Subject external metadata and optional primary teacher
ALTER TABLE "Subject"
ADD COLUMN "externalId" INTEGER,
ADD COLUMN "managedByExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastExternalSyncAt" TIMESTAMP(3),
ALTER COLUMN "teacherId" DROP NOT NULL;

CREATE UNIQUE INDEX "Subject_externalId_key" ON "Subject"("externalId");
CREATE INDEX "Subject_externalId_isActive_idx" ON "Subject"("externalId", "isActive");

-- GroupSubject now stores the exact teacher assignment
ALTER TABLE "GroupSubject"
ADD COLUMN "teacherId" TEXT,
ADD COLUMN "managedByExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "lastExternalSyncAt" TIMESTAMP(3);

UPDATE "GroupSubject" AS gs
SET "teacherId" = s."teacherId"
FROM "Subject" AS s
WHERE gs."subjectId" = s."id"
  AND gs."teacherId" IS NULL;

CREATE INDEX "GroupSubject_teacherId_idx" ON "GroupSubject"("teacherId");
CREATE INDEX "GroupSubject_groupId_teacherId_idx" ON "GroupSubject"("groupId", "teacherId");

ALTER TABLE "GroupSubject"
ADD CONSTRAINT "GroupSubject_teacherId_fkey"
FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Evaluations can now point to the exact group assignment that was evaluated
ALTER TABLE "Evaluation"
ADD COLUMN "groupSubjectId" TEXT;

CREATE INDEX "Evaluation_periodId_groupSubjectId_idx" ON "Evaluation"("periodId", "groupSubjectId");

ALTER TABLE "Evaluation"
ADD CONSTRAINT "Evaluation_groupSubjectId_fkey"
FOREIGN KEY ("groupSubjectId") REFERENCES "GroupSubject"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
