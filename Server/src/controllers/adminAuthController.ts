import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export async function loginAdmin(req: Request, res: Response): Promise<void> {
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const operatorNameInput =
    typeof req.body?.operatorName === "string" ? req.body.operatorName : "";
  const operatorName = operatorNameInput.trim() || "Admin Operator";

  if (!password) {
    res.status(400).json({ message: "Password is required." });
    return;
  }

  let isValidPassword = false;
  if (env.adminPasswordHash) {
    isValidPassword = await bcrypt.compare(password, env.adminPasswordHash);
  } else if (env.adminPassword) {
    isValidPassword = password === env.adminPassword;
  }

  if (!isValidPassword) {
    res.status(401).json({ message: "Invalid admin password." });
    return;
  }

  const token = jwt.sign(
    {
      role: "ADMIN",
      operatorName,
    },
    env.jwtSecret,
    { expiresIn: "12h" },
  );

  res.status(200).json({
    token,
    operatorName,
    expiresIn: "12h",
  });
}

export function getCurrentAdmin(req: Request, res: Response): void {
  res.status(200).json({
    operatorName: req.admin?.operatorName,
    role: req.admin?.role,
  });
}
