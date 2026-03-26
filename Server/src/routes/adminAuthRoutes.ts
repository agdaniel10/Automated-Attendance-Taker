import { Router } from "express";

import { getCurrentAdmin, loginAdmin } from "../controllers/adminAuthController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.post("/login", loginAdmin);
router.get("/me", requireAdminAuth, getCurrentAdmin);

export default router;
