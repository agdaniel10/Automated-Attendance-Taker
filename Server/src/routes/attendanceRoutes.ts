import { Router } from "express";

import {
  adminApproveAttendance,
  closeSession,
  exportSessionCsv,
  listReviewQueue,
  listSessionEvents,
  listSessions,
  markAttendanceByAagcNumber,
  scanAttendance,
  startSession,
} from "../controllers/attendanceController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.use(requireAdminAuth);

router.get("/sessions", listSessions);
router.post("/sessions", startSession);
router.post("/sessions/:sessionId/close", closeSession);
router.get("/sessions/:sessionId/events", listSessionEvents);
router.get("/sessions/:sessionId/review-queue", listReviewQueue);
router.post("/sessions/:sessionId/scan", scanAttendance);
router.post("/sessions/:sessionId/mark-by-number", markAttendanceByAagcNumber);
router.post("/sessions/:sessionId/admin-approve", adminApproveAttendance);
router.get("/sessions/:sessionId/export.csv", exportSessionCsv);

export default router;
