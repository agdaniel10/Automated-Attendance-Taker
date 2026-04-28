import prisma from "../lib/prisma";
import { hasPrismaErrorCode } from "../utils/prismaError";

export type MemberRegistrationInput = {
  name: string;
  departmentId: string;
  phone: string;
  email: string;
};

export class EmailAlreadyExistsError extends Error {
  constructor() {
    super("Email already exists.");
    this.name = "EmailAlreadyExistsError";
  }
}

export class AagcNumberGenerationError extends Error {
  constructor() {
    super("Unable to generate AAGC number.");
    this.name = "AagcNumberGenerationError";
  }
}

const AAGC_NUMBER_WIDTH = 6;
const MAX_AAGC_GENERATION_RETRIES = 5;

function formatAagcNumber(sequence: number): string {
  return `AAGC-${String(sequence).padStart(AAGC_NUMBER_WIDTH, "0")}`;
}

export async function isEmailRegistered(email: string): Promise<boolean> {
  const existing = await prisma.member.findUnique({
    where: { email },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function createMemberWithAagc(
  input: MemberRegistrationInput,
): Promise<{
  id: string;
  aagcNumber: string | null;
  aagcSequence: number | null;
  name: string;
  phone: string;
  email: string;
  biometricStatus: string;
  departmentId: string;
  createdAt: Date;
  updatedAt: Date;
  department: { id: string; name: string; createdAt: Date; updatedAt: Date };
}> {
  for (let attempt = 0; attempt < MAX_AAGC_GENERATION_RETRIES; attempt += 1) {
    try {
      const createdMember = await prisma.$transaction(async (tx) => {
        const lastSequenceMember = await tx.member.findFirst({
          where: { aagcSequence: { not: null } },
          orderBy: { aagcSequence: "desc" },
          select: { aagcSequence: true },
        });

        const nextSequence = (lastSequenceMember?.aagcSequence ?? 0) + 1;
        const aagcNumber = formatAagcNumber(nextSequence);

        return tx.member.create({
          data: {
            ...input,
            aagcSequence: nextSequence,
            aagcNumber,
          },
          include: {
            department: true,
          },
        });
      });

      return createdMember;
    } catch (error) {
      if (!hasPrismaErrorCode(error, "P2002")) {
        throw error;
      }

      const emailTaken = await isEmailRegistered(input.email);
      if (emailTaken) {
        throw new EmailAlreadyExistsError();
      }
    }
  }

  throw new AagcNumberGenerationError();
}
