import { Router } from "express";

import {
  getCurrentScanner,
  loginScanner,
} from "../controllers/scannerAuthController";
import { requireScannerAuth } from "../middleware/auth";

const router = Router();

router.post("/login", loginScanner);
router.get("/me", requireScannerAuth, getCurrentScanner);

export default router;
