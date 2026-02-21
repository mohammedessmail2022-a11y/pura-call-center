-- Drop clinic column and add numberOfTrials column for PostgreSQL
ALTER TABLE "calls" DROP COLUMN IF EXISTS "clinic";
ALTER TABLE "calls" ADD COLUMN "numberOfTrials" integer NOT NULL DEFAULT 1;
