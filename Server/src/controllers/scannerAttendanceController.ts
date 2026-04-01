import type { Request, Response } from "express";

import { env } from "../config/env";
import prisma from "../lib/prisma";
import { decryptBiometricTemplate } from "../utils/biometricCrypto";

const SESSION_STATUS = {
  ACTIVE: "ACTIVE",
} as const;

const BIOMETRIC_STATUS = {
  ENROLLED: "ENROLLED",
} as const;

function toNodeBuffer(value: Uint8Array<ArrayBuffer>): Buffer {
  return Buffer.from(value);
}

async function findActiveSession() {
  return prisma.attendanceSession.findFirst({
    where: { status: SESSION_STATUS.ACTIVE },
    select: {
      id: true,
      programName: true,
      notes: true,
      status: true,
      startedAt: true,
      startedBy: true,
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}

export async function getActiveScannerSession(
  _req: Request,
  res: Response,
): Promise<void> {
  const session = await findActiveSession();

  if (!session) {
    res.status(404).json({
      message: "No active attendance session was found.",
      status: "session_not_active",
    });
    return;
  }

  res.status(200).json({
    id: session.id,
    programName: session.programName,
    notes: session.notes,
    status: session.status,
    startedAt: session.startedAt,
    startedBy: session.startedBy,
    eventCount: session._count.events,
  });
}

export async function listActiveSessionMatchingCandidates(
  _req: Request,
  res: Response,
): Promise<void> {
  const session = await findActiveSession();

  if (!session) {
    res.status(404).json({
      message: "No active attendance session was found.",
      status: "session_not_active",
    });
    return;
  }

  const members = await prisma.member.findMany({
    where: {
      biometricStatus: BIOMETRIC_STATUS.ENROLLED,
      biometricTemplates: {
        some: {},
      },
    },
    select: {
      id: true,
      aagcNumber: true,
      name: true,
      biometricStatus: true,
      phone: true,
      email: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      biometricTemplates: {
        select: {
          id: true,
          fingerPosition: true,
          qualityScore: true,
          updatedAt: true,
          encryptedTemplate: true,
          iv: true,
          authTag: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
      attendanceEvents: {
        where: {
          sessionId: session.id,
        },
        select: {
          id: true,
          occurredAt: true,
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const candidates = members.map((member) => ({
    memberId: member.id,
    aagcNumber: member.aagcNumber,
    name: member.name,
    biometricStatus: member.biometricStatus,
    phone: member.phone,
    email: member.email,
    department: member.department,
    alreadyMarked: member.attendanceEvents.length > 0,
    markedAt: member.attendanceEvents[0]?.occurredAt ?? null,
    templates: member.biometricTemplates.map((template) => ({
      id: template.id,
      fingerPosition: template.fingerPosition,
      qualityScore: template.qualityScore,
      updatedAt: template.updatedAt,
      templateBase64: decryptBiometricTemplate(
        toNodeBuffer(template.encryptedTemplate),
        toNodeBuffer(template.iv),
        toNodeBuffer(template.authTag),
        env.templateEncryptionKey,
      ),
    })),
  }));

  res.status(200).json({
    session: {
      id: session.id,
      programName: session.programName,
      notes: session.notes,
      startedAt: session.startedAt,
      startedBy: session.startedBy,
      eventCount: session._count.events,
    },
    candidateCount: candidates.length,
    candidates,
  });
}
