DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TeacherPosition'
  ) THEN
    CREATE TYPE "TeacherPosition" AS ENUM ('PA', 'PTC');
  END IF;
END $$;

ALTER TABLE "Teacher"
ADD COLUMN IF NOT EXISTS "position" "TeacherPosition" NOT NULL DEFAULT 'PA';

CREATE INDEX IF NOT EXISTS "Teacher_careerId_position_isActive_idx"
ON "Teacher"("careerId", "position", "isActive");

CREATE INDEX IF NOT EXISTS "Teacher_lastName_name_idx"
ON "Teacher"("lastName", "name");
