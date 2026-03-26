-- CreateEnum
CREATE TYPE "BiometricStatus" AS ENUM ('PENDING', 'ENROLLED');

-- CreateEnum
CREATE TYPE "FingerPosition" AS ENUM ('LEFT_THUMB', 'LEFT_INDEX', 'LEFT_MIDDLE', 'RIGHT_THUMB', 'RIGHT_INDEX', 'RIGHT_MIDDLE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AttendanceEventStatus" AS ENUM ('PRESENT');

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('SCANNER', 'ADMIN_APPROVAL');

-- CreateEnum
CREATE TYPE "VerificationOutcome" AS ENUM ('MATCHED', 'NO_MATCH', 'ADMIN_APPROVED');

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "biometricStatus" "BiometricStatus" NOT NULL DEFAULT 'PENDING',
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiometricTemplate" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "fingerPosition" "FingerPosition" NOT NULL,
    "encryptedTemplate" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "authTag" BYTEA NOT NULL,
    "templateVersion" TEXT NOT NULL DEFAULT 'v1',
    "qualityScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiometricTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "startedBy" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT,
    "guestName" TEXT,
    "eventStatus" "AttendanceEventStatus" NOT NULL DEFAULT 'PRESENT',
    "source" "AttendanceSource" NOT NULL DEFAULT 'SCANNER',
    "message" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "matchedMemberId" TEXT,
    "deviceId" TEXT,
    "confidence" DOUBLE PRECISION,
    "outcome" "VerificationOutcome" NOT NULL,
    "notes" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "Member_departmentId_idx" ON "Member"("departmentId");

-- CreateIndex
CREATE INDEX "Member_name_idx" ON "Member"("name");

-- CreateIndex
CREATE INDEX "BiometricTemplate_memberId_idx" ON "BiometricTemplate"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "BiometricTemplate_memberId_fingerPosition_key" ON "BiometricTemplate"("memberId", "fingerPosition");

-- CreateIndex
CREATE INDEX "AttendanceSession_status_startedAt_idx" ON "AttendanceSession"("status", "startedAt");

-- CreateIndex
CREATE INDEX "AttendanceSession_programName_idx" ON "AttendanceSession"("programName");

-- CreateIndex
CREATE INDEX "AttendanceEvent_sessionId_occurredAt_idx" ON "AttendanceEvent"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "AttendanceEvent_memberId_idx" ON "AttendanceEvent"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "session_member_unique" ON "AttendanceEvent"("sessionId", "memberId");

-- CreateIndex
CREATE INDEX "VerificationAttempt_sessionId_occurredAt_idx" ON "VerificationAttempt"("sessionId", "occurredAt");

-- CreateIndex
CREATE INDEX "VerificationAttempt_matchedMemberId_idx" ON "VerificationAttempt"("matchedMemberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricTemplate" ADD CONSTRAINT "BiometricTemplate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEvent" ADD CONSTRAINT "AttendanceEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceEvent" ADD CONSTRAINT "AttendanceEvent_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAttempt" ADD CONSTRAINT "VerificationAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationAttempt" ADD CONSTRAINT "VerificationAttempt_matchedMemberId_fkey" FOREIGN KEY ("matchedMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
