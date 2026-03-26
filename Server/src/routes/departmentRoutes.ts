import { Router } from "express";

import {
  createDepartment,
  listDepartments,
} from "../controllers/departmentController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.use(requireAdminAuth);

router.get("/", listDepartments);
router.post("/", createDepartment);

export default router;
