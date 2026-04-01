import { Router } from "express";

import { scanAttendance } from "../controllers/attendanceController";
import {
  getActiveScannerSession,
  listActiveSessionMatchingCandidates,
} from "../controllers/scannerAttendanceController";
import { requireScannerAuth } from "../middleware/auth";

const router = Router();

router.use(requireScannerAuth);

router.get("/active-session", getActiveScannerSession);
router.get("/active-session/matching-candidates", listActiveSessionMatchingCandidates);
router.post("/sessions/:sessionId/scan", scanAttendance);

export default router;
