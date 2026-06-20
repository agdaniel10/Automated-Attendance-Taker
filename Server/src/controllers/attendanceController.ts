import type { Request, Response } from "express";

import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { markAttendanceByAagc } from "../services/attendanceService";
import { normalizeAagcNumber } from "../utils/aagcNumber";
import { buildCsv } from "../utils/csv";
import { hasPrismaErrorCode } from "../utils/prismaError";
import { getRouteParam } from "../utils/request";

const ATTENDANCE_SOURCE = {
  SCANNER: "SCANNER",
  MEMBER_NUMBER: "MEMBER_NUMBER",
  ADMIN_APPROVAL: "ADMIN_APPROVAL",
} as const;

const VERIFICATION_OUTCOME = {
  MATCHED: "MATCHED",
  NO_MATCH: "NO_MATCH",
  ADMIN_APPROVED: "ADMIN_APPROVED",
} as const;

const REVIEW_QUEUE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  ALL: "ALL",
} as const;

const SESSION_STATUS = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;

type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];
type ReviewQueueStatus =
  (typeof REVIEW_QUEUE_STATUS)[keyof typeof REVIEW_QUEUE_STATUS];

function mapAttendanceMember(member: any) {
  if (!member) {
    return null;
  }

  return {
    id: member.id,
    aagcNumber: member.aagcNumber ?? null,
    name: member.name,
    department: member.department?.name ?? "Unknown",
  };
}

function parseReviewQueueStatus(value: unknown): ReviewQueueStatus {
  const normalized =
    typeof value === "string" ? value.trim().toUpperCase() : REVIEW_QUEUE_STATUS.PENDING;

  if (
    normalized === REVIEW_QUEUE_STATUS.PENDING ||
    normalized === REVIEW_QUEUE_STATUS.APPROVED ||
    normalized === REVIEW_QUEUE_STATUS.ALL
  ) {
    return normalized;
  }

  return REVIEW_QUEUE_STATUS.PENDING;
}

function buildReviewQueueWhere(status: ReviewQueueStatus) {
  if (status === REVIEW_QUEUE_STATUS.APPROVED) {
    return {
      outcome: VERIFICATION_OUTCOME.ADMIN_APPROVED,
    };
  }

  if (status === REVIEW_QUEUE_STATUS.ALL) {
    return {
      outcome: {
        in: [VERIFICATION_OUTCOME.NO_MATCH, VERIFICATION_OUTCOME.ADMIN_APPROVED],
      },
    };
  }

  return {
    outcome: VERIFICATION_OUTCOME.NO_MATCH,
  };
}

export async function listSessions(req: Request, res: Response): Promise<void> {
  const statusQuery =
    typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
  const status =
    statusQuery === SESSION_STATUS.ACTIVE || statusQuery === SESSION_STATUS.CLOSED
      ? (statusQuery as SessionStatus)
      : undefined;

  const sessions = await prisma.attendanceSession.findMany({
    where: status ? { status } : undefined,
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
    take: 100,
  });

  res.status(200).json(sessions);
}

export async function startSession(req: Request, res: Response): Promise<void> {
  const programName =
    typeof req.body?.programName === "string" ? req.body.programName.trim() : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : null;

  if (!programName) {
    res.status(400).json({ message: "programName is required." });
    return;
  }

  const activeSession = await prisma.attendanceSession.findFirst({
    where: { status: SESSION_STATUS.ACTIVE },
    select: { id: true, programName: true, startedAt: true },
  });

  if (activeSession) {
    res.status(409).json({
      message: "An attendance session is already active.",
      activeSession,
    });
    return;
  }

  const session = await prisma.attendanceSession.create({
    data: {
      programName,
      notes,
      startedBy: req.admin?.operatorName ?? "Admin Operator",
    },
  });
  // generate QR check-in token for this session
  const token = jwt.sign(
    { type: "QR_CHECKIN", sessionId: session.id },
    env.jwtSecret,
    { expiresIn: `${env.qrTokenTtlHours}h` },
  );

  res.status(201).json({ session, qrToken: token });
}

export async function scanAttendance(req: Request, res: Response): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);
  const memberId =
    typeof req.body?.memberId === "string" ? req.body.memberId.trim() : "";
  const requestDeviceId =
    typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
  const deviceId = requestDeviceId || req.scanner?.deviceId || null;
  const confidenceRaw = req.body?.confidence;
  const confidence =
    typeof confidenceRaw === "number" && Number.isFinite(confidenceRaw)
      ? confidenceRaw
      : null;

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      status: SESSION_STATUS.ACTIVE,
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    res.status(404).json({
      message: "Active attendance session not found.",
      status: "session_not_active",
    });
    return;
  }

  if (!memberId) {
    await prisma.verificationAttempt.create({
      data: {
        sessionId,
        outcome: VERIFICATION_OUTCOME.NO_MATCH,
        deviceId,
        confidence,
        notes: "No match returned by scanner.",
      },
    });

    res.status(404).json({
      status: "no_match",
      message: "Fingerprint not recognized. Please see an admin for approval.",
    });
    return;
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      department: true,
      _count: {
        select: {
          biometricTemplates: true,
        },
      },
    },
  });

  if (!member) {
    await prisma.verificationAttempt.create({
      data: {
        sessionId,
        outcome: VERIFICATION_OUTCOME.NO_MATCH,
        deviceId,
        confidence,
        notes: "Scanner returned member ID that does not exist.",
      },
    });

    res.status(404).json({
      status: "no_match",
      message: "User not found. Please see an admin for approval.",
    });
    return;
  }

  if (member._count.biometricTemplates < 2) {
    await prisma.verificationAttempt.create({
      data: {
        sessionId,
        matchedMemberId: member.id,
        outcome: VERIFICATION_OUTCOME.NO_MATCH,
        deviceId,
        confidence,
        notes: "Member has fewer than two enrolled fingers.",
      },
    });

    res.status(400).json({
      status: "member_not_enrolled",
      message: "Member has not completed two-finger enrollment.",
    });
    return;
  }

  const existingEvent = await prisma.attendanceEvent.findFirst({
    where: {
      sessionId,
      memberId: member.id,
    },
    select: {
      id: true,
      occurredAt: true,
    },
  });

  if (existingEvent) {
    res.status(200).json({
      status: "already_marked",
      message: `${member.name}, your attendance has already been recorded.`,
      member: {
        id: member.id,
        aagcNumber: member.aagcNumber,
        name: member.name,
        department: member.department.name,
      },
      markedAt: existingEvent.occurredAt,
    });
    return;
  }

  const welcomeMessage = `${member.name}, welcome to service`;

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      await tx.verificationAttempt.create({
        data: {
          sessionId,
          matchedMemberId: member.id,
          outcome: VERIFICATION_OUTCOME.MATCHED,
          deviceId,
          confidence,
          notes: "Successful fingerprint identification.",
        },
      });

      const event = await tx.attendanceEvent.create({
        data: {
          sessionId,
          memberId: member.id,
          source: ATTENDANCE_SOURCE.SCANNER,
          message: welcomeMessage,
        },
      });

      return event;
    });

    res.status(200).json({
      status: "present",
      message: welcomeMessage,
      member: {
        id: member.id,
        aagcNumber: member.aagcNumber,
        name: member.name,
        department: member.department.name,
      },
      attendanceEventId: result.id,
      markedAt: result.occurredAt,
    });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      res.status(200).json({
        status: "already_marked",
        message: `${member.name}, your attendance has already been recorded.`,
        member: {
          id: member.id,
          aagcNumber: member.aagcNumber,
          name: member.name,
          department: member.department.name,
        },
      });
      return;
    }

    throw error;
  }
}

export async function markAttendanceByAagcNumber(
  req: Request,
  res: Response,
): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);
  const aagcNumberInput =
    typeof req.body?.aagcNumber === "string" ? req.body.aagcNumber : "";
  const aagcNumber = normalizeAagcNumber(aagcNumberInput);

  if (!aagcNumber) {
    res.status(400).json({
      message: "aagcNumber is required and must look like AAGC1 or 1.",
    });
    return;
  }

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      status: SESSION_STATUS.ACTIVE,
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    res.status(404).json({
      message: "Active attendance session not found.",
      status: "session_not_active",
    });
    return;
  }

  const member = await prisma.member.findUnique({
    where: { aagcNumber },
    include: {
      department: true,
    },
  });

  if (!member) {
    res.status(404).json({
      status: "member_not_found",
      message: `No member was found for ${aagcNumber}.`,
    });
    return;
  }

  const existingEvent = await prisma.attendanceEvent.findFirst({
    where: {
      sessionId,
      memberId: member.id,
    },
    select: {
      id: true,
      occurredAt: true,
    },
  });

  if (existingEvent) {
    res.status(200).json({
      status: "already_marked",
      message: `${member.name}, your attendance has already been recorded.`,
      member: {
        id: member.id,
        aagcNumber: member.aagcNumber,
        name: member.name,
        department: member.department.name,
      },
      markedAt: existingEvent.occurredAt,
    });
    return;
  }

  const welcomeMessage = `${member.name}, welcome to service`;

  try {
    const event = await prisma.attendanceEvent.create({
      data: {
        sessionId,
        memberId: member.id,
        source: ATTENDANCE_SOURCE.MEMBER_NUMBER,
        message: welcomeMessage,
      },
    });

    res.status(200).json({
      status: "present",
      message: welcomeMessage,
      member: {
        id: member.id,
        aagcNumber: member.aagcNumber,
        name: member.name,
        department: member.department.name,
      },
      attendanceEventId: event.id,
      markedAt: event.occurredAt,
    });
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      res.status(200).json({
        status: "already_marked",
        message: `${member.name}, your attendance has already been recorded.`,
        member: {
          id: member.id,
          aagcNumber: member.aagcNumber,
          name: member.name,
          department: member.department.name,
        },
      });
      return;
    }

    throw error;
  }
}

export async function qrCheckin(req: Request, res: Response): Promise<void> {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const aagcNumberInput =
    typeof req.body?.aagcNumber === "string" ? req.body.aagcNumber : "";

  if (!token) {
    res.status(400).json({ message: "QR token is required." });
    return;
  }

  let payload: any = null;
  try {
    payload = jwt.verify(token, env.jwtSecret) as any;
  } catch (error) {
    res.status(401).json({ message: "QR token is invalid or expired." });
    return;
  }

  if (!payload || payload.type !== "QR_CHECKIN" || !payload.sessionId) {
    res.status(400).json({ message: "QR token is not a valid check-in token." });
    return;
  }

  const result = await markAttendanceByAagc(payload.sessionId, aagcNumberInput);

  if (result.status === "invalid_aagc") {
    res.status(400).json({ message: result.message });
    return;
  }

  if (result.status === "session_not_active") {
    res.status(404).json({ message: result.message, status: "session_not_active" });
    return;
  }

  if (result.status === "member_not_found") {
    res.status(404).json({ status: "member_not_found", message: result.message });
    return;
  }

  if (result.status === "already_marked" || result.status === "present") {
    res.status(200).json(result);
    return;
  }

  res.status(500).json({ message: "Unknown error." });
}

export async function adminApproveAttendance(
  req: Request,
  res: Response,
): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);
  const displayNameInput =
    typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
  const notes = typeof req.body?.notes === "string" ? req.body.notes.trim() : null;
  const attemptId =
    typeof req.body?.attemptId === "string" ? req.body.attemptId.trim() : null;

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    res.status(404).json({ message: "Attendance session not found." });
    return;
  }

  if (session.status !== SESSION_STATUS.ACTIVE) {
    res.status(400).json({ message: "Cannot approve attendance for a closed session." });
    return;
  }

  let attempt: any = null;

  if (attemptId) {
    attempt = await prisma.verificationAttempt.findFirst({
      where: {
        id: attemptId,
        sessionId,
      },
      include: {
        matchedMember: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!attempt) {
      res.status(404).json({ message: "Verification attempt not found." });
      return;
    }

    if (attempt.outcome === VERIFICATION_OUTCOME.ADMIN_APPROVED || attempt.approvedAt) {
      res.status(409).json({
        message: "This no-match attempt has already been reviewed.",
      });
      return;
    }
  }

  const member = attempt?.matchedMember ?? null;
  const displayName = member?.name ?? (displayNameInput || "");

  if (!displayName) {
    res.status(400).json({
      message: "displayName is required when the selected no-match case has no linked member.",
    });
    return;
  }

  if (member) {
    const existingEvent = await prisma.attendanceEvent.findFirst({
      where: {
        sessionId,
        memberId: member.id,
      },
      select: {
        id: true,
        occurredAt: true,
      },
    });

    if (existingEvent) {
      if (attemptId) {
        await prisma.verificationAttempt.updateMany({
          where: {
            id: attemptId,
            sessionId,
          },
          data: {
            outcome: VERIFICATION_OUTCOME.ADMIN_APPROVED,
            approvedBy: req.admin?.operatorName ?? "Admin Operator",
            approvedAt: new Date(),
            notes:
              notes ??
              "No-match attempt reviewed by admin after attendance had already been recorded.",
          },
        });
      }

      res.status(200).json({
        status: "already_marked",
        message: `${member.name}, your attendance has already been recorded.`,
        member: mapAttendanceMember(member),
        markedAt: existingEvent.occurredAt,
        reviewedAttemptId: attemptId,
      });
      return;
    }
  }

  const welcomeMessage = `${displayName}, welcome to service`;

  const result = await prisma.$transaction(async (tx: any) => {
    const event = await tx.attendanceEvent.create({
      data: {
        sessionId,
        ...(member ? { memberId: member.id } : { guestName: displayName }),
        source: ATTENDANCE_SOURCE.ADMIN_APPROVAL,
        message: welcomeMessage,
      },
    });

    if (attemptId) {
      await tx.verificationAttempt.updateMany({
        where: {
          id: attemptId,
          sessionId,
        },
        data: {
          outcome: VERIFICATION_OUTCOME.ADMIN_APPROVED,
          approvedBy: req.admin?.operatorName ?? "Admin Operator",
          approvedAt: new Date(),
          notes: notes ?? "No-match attempt manually approved by admin.",
        },
      });
    }

    return event;
  });

  res.status(201).json({
    status: "approved",
    attendanceEventId: result.id,
    message: welcomeMessage,
    occurredAt: result.occurredAt,
    member: mapAttendanceMember(member),
    reviewedAttemptId: attemptId,
  });
}

export async function exportSessionCsv(
  req: Request,
  res: Response,
): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      events: {
        include: {
          member: {
            include: {
              department: true,
            },
          },
        },
        orderBy: {
          occurredAt: "asc",
        },
      },
    },
  });

  if (!session) {
    res.status(404).json({ message: "Attendance session not found." });
    return;
  }

  const headers = [
    "timestamp",
    "status",
    "source",
    "aagcNumber",
    "name",
    "department",
    "phone",
    "email",
    "message",
  ];

  const rows = session.events.map((event: any) => [
    event.occurredAt.toISOString(),
    event.eventStatus,
    event.source,
    event.member?.aagcNumber ?? "",
    event.member?.name ?? event.guestName ?? "",
    event.member?.department?.name ?? "",
    event.member?.phone ?? "",
    event.member?.email ?? "",
    event.message ?? "",
  ]);

  const csv = buildCsv(headers, rows);
  const safeProgramName = session.programName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const filename = `attendance-${safeProgramName || "session"}-${session.id}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.status(200).send(csv);
}


/// Added controllers
export async function closeSession(req: Request, res: Response): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true },
  });

  if (!session) {
    res.status(404).json({ message: "Attendance session not found." });
    return;
  }

  if (session.status === SESSION_STATUS.CLOSED) {
    res.status(409).json({ message: "Session is already closed." });
    return;
  }

  const updated = await prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: SESSION_STATUS.CLOSED, endedAt: new Date() },
  });

  res.status(200).json(updated);
}

export async function listSessionEvents(req: Request, res: Response): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);

  const events = await prisma.attendanceEvent.findMany({
    where: { sessionId },
    include: {
      member: {
        include: { department: true },
      },
    },
    orderBy: { occurredAt: "asc" },
  });

  res.status(200).json(events);
}

export async function listReviewQueue(req: Request, res: Response): Promise<void> {
  const sessionId = getRouteParam(req.params.sessionId);
  const status = parseReviewQueueStatus(req.query.status);

  const attempts = await prisma.verificationAttempt.findMany({
    where: {
      sessionId,
      ...buildReviewQueueWhere(status),
    },
    include: {
      matchedMember: {
        include: { department: true },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });

  res.status(200).json(attempts);
}