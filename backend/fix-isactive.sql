-- Add isActive column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to have isActive = true
UPDATE "User" SET "isActive" = true WHERE "isActive" IS NULL;
