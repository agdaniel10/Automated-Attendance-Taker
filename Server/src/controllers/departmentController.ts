import type { Request, Response } from "express";

import prisma from "../lib/prisma";
import { hasPrismaErrorCode } from "../utils/prismaError";

export async function listDepartments(
  _req: Request,
  res: Response,
): Promise<void> {
  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  res.status(200).json(departments);
}

export async function createDepartment(
  req: Request,
  res: Response,
): Promise<void> {
  const rawName = typeof req.body?.name === "string" ? req.body.name : "";
  const name = rawName.trim();

  if (!name) {
    res.status(400).json({ message: "Department name is required." });
    return;
  }

  try {
    const department = await prisma.department.create({
      data: {
        name,
      },
    });

    res.status(201).json(department);
  } catch (error) {
    if (hasPrismaErrorCode(error, "P2002")) {
      res.status(409).json({ message: "Department name already exists." });
      return;
    }

    throw error;
  }
}
