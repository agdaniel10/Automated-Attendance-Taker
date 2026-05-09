import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { env } from "../config/env";
import prisma from "../lib/prisma";
import { buildAagcNumber, normalizeAagcNumber } from "../utils/aagcNumber";
import { encryptBiometricTemplate } from "../utils/biometricCrypto";
import { hasPrismaErrorCode } from "../utils/prismaError";
import { getRouteParam } from "../utils/request";

const BIOMETRIC_STATUS = {
  PENDING: "PENDING",
  ENROLLED: "ENROLLED",
} as const;

const FINGER_POSITIONS = [
  "LEFT_THUMB",
  "LEFT_INDEX",
  "LEFT_MIDDLE",
  "RIGHT_THUMB",
  "RIGHT_INDEX",
  "RIGHT_MIDDLE",
] as const;

type FingerPosition = (typeof FINGER_POSITIONS)[number];

const validFingerPositions = new Set<string>(FINGER_POSITIONS);

function normalizeEmail(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail ? normalizedEmail : null;
}

function toPrismaBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
  return buffer as unknown as Uint8Array<ArrayBuffer>;
}

function toMemberSummary(
  member: Prisma.MemberGetPayload<{
    include: {
      department: true;
      _count: {
        select: {
          biometricTemplates: true;
        };
      };
    };
  }>,
) {
  return {
    id: member.id,
    aagcNumber: member.aagcNumber,
    name: member.name,
    phone: member.phone,
    email: member.email,
    biometricStatus: member.biometricStatus,
    department: member.department,
    enrolledFingerCount: member._count.biometricTemplates,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

async function ensureDepartmentExists(departmentId: string): Promise<boolean> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { id: true },
  });
  return Boolean(department);
}

async function getNextAagcSequence(
  tx: Prisma.TransactionClient,
): Promise<number> {
  const latestMember = await tx.member.findFirst({
    where: {
      aagcSequence: {
        not: null,
      },
    },
    select: {
      aagcSequence: true,
    },
    orderBy: {
      aagcSequence: "desc",
    },
  });

  return (latestMember?.aagcSequence ?? 0) + 1;
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  const normalizedAagcNumber = normalizeAagcNumber(search);
  const aagcNumberFilter = normalizedAagcNumber
    ? [{ aagcNumber: { equals: normalizedAagcNumber, mode: "insensitive" as const } }]
    : search.toUpperCase().startsWith("AAGC")
      ? [{ aagcNumber: { contains: search, mode: "insensitive" as const } }]
      : [];

  const where = {
    ...(departmentId ? { departmentId } : {}),
    ...(search
      ? {
          OR: [
            ...aagcNumberFilter,
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const members = await prisma.member.findMany({
    where,
    include: {
      department: true,
      _count: {
        select: {
          biometricTemplates: true,
        },
      },
    },
    orderBy: [{ aagcSequence: "asc" }, { name: "asc" }],
  });

  const response = members.map(toMemberSummary);

  res.status(200).json(response);
}

export async function createMember(req: Request, res: Response): Promise<void> {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const departmentId =
    typeof req.body?.departmentId === "string" ? req.body.departmentId.trim() : "";
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const emailInput = typeof req.body?.email === "string" ? req.body.email : "";
  const email = normalizeEmail(emailInput);

  if (!name || !departmentId || !phone) {
    res.status(400).json({
      message: "name, departmentId, and phone are required.",
    });
    return;
  }

  if (!(await ensureDepartmentExists(departmentId))) {
    res.status(404).json({ message: "Department not found." });
    return;
  }

  let isEmailConflict = false;

  try {
    let member:
      | Prisma.MemberGetPayload<{
          include: {
            department: true;
            _count: {
              select: {
                biometricTemplates: true;
              };
            };
          };
        }>
      | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        member = await prisma.$transaction(async (tx) => {
          const nextAagcSequence = await getNextAagcSequence(tx);

          return tx.member.create({
            data: {
              aagcSequence: nextAagcSequence,
              aagcNumber: buildAagcNumber(nextAagcSequence),
              name,
              departmentId,
              phone,
              email,
            },
            include: {
              department: true,
              _count: {
                select: {
                  biometricTemplates: true,
                },
              },
            },
          });
        });

        break;
      } catch (error) {
        if (!hasPrismaErrorCode(error, "P2002")) {
          throw error;
        }

        if (!email) {
          if (attempt === 4) {
            throw error;
          }

          continue;
        }

        const existingEmail = await prisma.member.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingEmail) {
          isEmailConflict = true;
          break;
        }

        if (attempt === 4) {
          throw error;
        }
      }
    }

    if (isEmailConflict) {
      res.status(409).json({ message: "Email already exists." });
      return;
    }

    if (!member) {
      res.status(503).json({
        message:
          "Unable to assign an AAGC number right now. Please try creating the member again.",
      });
      return;
    }

    res.status(201).json(toMemberSummary(member));
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      if (!email) {
        res.status(503).json({
          message:
            "Unable to assign an AAGC number right now. Please try creating the member again.",
        });
        return;
      }

      const existingEmail = await prisma.member.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingEmail) {
        res.status(409).json({ message: "Email already exists." });
        return;
      }

      res.status(503).json({
        message:
          "Unable to assign an AAGC number right now. Please try creating the member again.",
      });
      return;
    }

    throw error;
  }
}

export async function getMemberBiometrics(
  req: Request,
  res: Response,
): Promise<void> {
  const memberId = getRouteParam(req.params.memberId);

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      biometricTemplates: {
        select: {
          id: true,
          fingerPosition: true,
          qualityScore: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!member) {
    res.status(404).json({ message: "Member not found." });
    return;
  }

  res.status(200).json({
    memberId: member.id,
    aagcNumber: member.aagcNumber,
    biometricStatus: member.biometricStatus,
    enrolledFingerCount: member.biometricTemplates.length,
    templates: member.biometricTemplates,
  });
}

export async function enrollMemberBiometric(
  req: Request,
  res: Response,
): Promise<void> {
  const memberId = getRouteParam(req.params.memberId);
  const fingerPositionInput =
    typeof req.body?.fingerPosition === "string" ? req.body.fingerPosition : "";
  const templateBase64 =
    typeof req.body?.templateBase64 === "string" ? req.body.templateBase64.trim() : "";
  const qualityScore = req.body?.qualityScore;

  if (!validFingerPositions.has(fingerPositionInput)) {
    res.status(400).json({
      message:
        "fingerPosition is required and must be one of the supported finger positions.",
    });
    return;
  }

  if (!templateBase64) {
    res.status(400).json({ message: "templateBase64 is required." });
    return;
  }

  if (
    qualityScore !== undefined &&
    (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100)
  ) {
    res.status(400).json({
      message: "qualityScore must be an integer between 0 and 100 when provided.",
    });
    return;
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true },
  });

  if (!member) {
    res.status(404).json({ message: "Member not found." });
    return;
  }

  const fingerPosition = fingerPositionInput as FingerPosition;

  let encrypted;
  try {
    encrypted = encryptBiometricTemplate(templateBase64, env.templateEncryptionKey);
  } catch {
    res.status(400).json({ message: "Invalid biometric template format." });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.biometricTemplate.upsert({
      where: {
        memberId_fingerPosition: {
          memberId,
          fingerPosition,
        },
      },
      create: {
        memberId,
        fingerPosition,
        encryptedTemplate: toPrismaBytes(encrypted.encryptedTemplate),
        iv: toPrismaBytes(encrypted.iv),
        authTag: toPrismaBytes(encrypted.authTag),
        qualityScore: Number.isInteger(qualityScore) ? qualityScore : null,
      },
      update: {
        encryptedTemplate: toPrismaBytes(encrypted.encryptedTemplate),
        iv: toPrismaBytes(encrypted.iv),
        authTag: toPrismaBytes(encrypted.authTag),
        qualityScore: Number.isInteger(qualityScore) ? qualityScore : null,
      },
    });

    const enrolledFingerCount = await tx.biometricTemplate.count({
      where: { memberId },
    });

    const biometricStatus =
      enrolledFingerCount >= 2
        ? BIOMETRIC_STATUS.ENROLLED
        : BIOMETRIC_STATUS.PENDING;

    const updatedMember = await tx.member.update({
      where: { id: memberId },
      data: { biometricStatus },
      select: {
        id: true,
        biometricStatus: true,
      },
    });

    return {
      member: updatedMember,
      enrolledFingerCount,
    };
  });

  res.status(200).json({
    memberId: result.member.id,
    biometricStatus: result.member.biometricStatus,
    enrolledFingerCount: result.enrolledFingerCount,
    enrollmentComplete: result.enrolledFingerCount >= 2,
  });
}
