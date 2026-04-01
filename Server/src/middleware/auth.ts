import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";

type AdminTokenPayload = JwtPayload & {
  role: "ADMIN";
  operatorName: string;
};

type ScannerTokenPayload = JwtPayload & {
  role: "SCANNER";
  deviceId: string;
  deviceName: string;
};

function getBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Authorization token is required." });
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

export function requireScannerAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ message: "Authorization token is required." });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as ScannerTokenPayload;

    if (payload.role !== "SCANNER" || !payload.deviceId || !payload.deviceName) {
      res.status(403).json({ message: "Scanner access is required." });
      return;
    }

    req.scanner = {
      role: payload.role,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token is invalid or expired." });
  }
}
