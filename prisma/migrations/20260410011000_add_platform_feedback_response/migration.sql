CREATE TABLE "PlatformFeedbackResponse" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "q1" INTEGER NOT NULL,
  "q2" INTEGER NOT NULL,
  "q3" INTEGER NOT NULL,
  "q4" INTEGER NOT NULL,
  "q5" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlatformFeedbackResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformFeedbackResponse_studentId_periodId_key"
ON "PlatformFeedbackResponse"("studentId", "periodId");

CREATE INDEX "PlatformFeedbackResponse_periodId_createdAt_idx"
ON "PlatformFeedbackResponse"("periodId", "createdAt");

ALTER TABLE "PlatformFeedbackResponse"
ADD CONSTRAINT "PlatformFeedbackResponse_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlatformFeedbackResponse"
ADD CONSTRAINT "PlatformFeedbackResponse_periodId_fkey"
FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
