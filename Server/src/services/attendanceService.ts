import prisma from "../lib/prisma";
import { normalizeAagcNumber } from "../utils/aagcNumber";
import { hasPrismaErrorCode } from "../utils/prismaError";

const ATTENDANCE_SOURCE = {
  MEMBER_NUMBER: "MEMBER_NUMBER",
} as const;

export async function markAttendanceByAagc(sessionId: string, aagcNumberInput: string) {
  const aagcNumber = normalizeAagcNumber(aagcNumberInput);

  if (!aagcNumber) {
    return { status: "invalid_aagc", message: "aagcNumber is required and must look like AAGC1 or 1." };
  }

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!session) {
    return { status: "session_not_active", message: "Active attendance session not found." };
  }

  const member = await prisma.member.findUnique({
    where: { aagcNumber },
    include: { department: true },
  });

  if (!member) {
    return { status: "member_not_found", message: `No member was found for ${aagcNumber}.` };
  }

  const existingEvent = await prisma.attendanceEvent.findFirst({
    where: { sessionId, memberId: member.id },
    select: { id: true, occurredAt: true },
  });

  if (existingEvent) {
    return {
      status: "already_marked",
      member: {
        id: member.id,
        aagcNumber: member.aagcNumber,
        name: member.name,
        department: member.department.name,
      },
      markedAt: existingEvent.occurredAt,
    };
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

    return {
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
    };
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      return {
        status: "already_marked",
        member: {
          id: member.id,
          aagcNumber: member.aagcNumber,
          name: member.name,
          department: member.department.name,
        },
      };
    }

    throw error;
  }
}

export default {};
