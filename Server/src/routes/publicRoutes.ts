import { Router } from "express";

import { listDepartments } from "../controllers/departmentController";
import { createMember } from "../controllers/memberController";
import { qrCheckin } from "../controllers/attendanceController";

const router = Router();

router.get("/departments", listDepartments);
router.post("/register", createMember);
router.post("/qr-checkin", qrCheckin);

export default router;
