import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

export function loginScanner(req: Request, res: Response): void {
  if (!env.scannerSharedSecret) {
    res.status(503).json({
      message:
        "Scanner authentication is not configured. Set SCANNER_SHARED_SECRET in the server environment.",
    });
    return;
  }

  const deviceId =
    typeof req.body?.deviceId === "string" ? req.body.deviceId.trim() : "";
  const deviceNameInput =
    typeof req.body?.deviceName === "string" ? req.body.deviceName : "";
  const deviceName = deviceNameInput.trim() || "Attendance Scanner";
  const secret = typeof req.body?.secret === "string" ? req.body.secret : "";

  if (!deviceId || !secret) {
    res.status(400).json({
      message: "deviceId and secret are required.",
    });
    return;
  }

  if (secret !== env.scannerSharedSecret) {
    res.status(401).json({ message: "Invalid scanner secret." });
    return;
  }

  const token = jwt.sign(
    {
      role: "SCANNER",
      deviceId,
      deviceName,
    },
    env.jwtSecret,
    { expiresIn: "30d" },
  );

  res.status(200).json({
    token,
    deviceId,
    deviceName,
    expiresIn: "30d",
  });
}

export function getCurrentScanner(req: Request, res: Response): void {
  res.status(200).json({
    role: req.scanner?.role,
    deviceId: req.scanner?.deviceId,
    deviceName: req.scanner?.deviceName,
  });
}
