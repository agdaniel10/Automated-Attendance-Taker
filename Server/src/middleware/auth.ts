import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";

type AdminTokenPayload = JwtPayload & {
  role: "ADMIN";
  operatorName: string;
};

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: "Authorization token is required." });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    res
      .status(401)
      .json({ message: "Invalid authorization format. Use Bearer token." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AdminTokenPayload;

    if (payload.role !== "ADMIN" || !payload.operatorName) {
      res.status(403).json({ message: "Admin access is required." });
      return;
    }

    req.admin = {
      role: payload.role,
      operatorName: payload.operatorName,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token is invalid or expired." });
  }
}
