import { Router } from "express";

import { listDepartments } from "../controllers/departmentController";
import { createMember } from "../controllers/memberController";

const router = Router();

router.get("/departments", listDepartments);
router.post("/register", createMember);

export default router;
