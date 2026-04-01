-- AlterEnum
ALTER TYPE "AttendanceSource" ADD VALUE 'MEMBER_NUMBER';

-- AlterTable
ALTER TABLE "Member"
ADD COLUMN "aagcNumber" TEXT,
ADD COLUMN "aagcSequence" INTEGER;

-- Backfill existing members in creation order so current records receive stable numbers.
WITH numbered_members AS (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt" ASC, "id" ASC) AS sequence_number
    FROM "Member"
)
UPDATE "Member" AS member
SET "aagcSequence" = numbered_members.sequence_number,
    "aagcNumber" = 'AAGC' || numbered_members.sequence_number
FROM numbered_members
WHERE member."id" = numbered_members."id";

-- CreateIndex
CREATE UNIQUE INDEX "Member_aagcNumber_key" ON "Member"("aagcNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Member_aagcSequence_key" ON "Member"("aagcSequence");
