import { Router } from "express";

import {
  createMember,
  enrollMemberBiometric,
  getMemberBiometrics,
  listMembers,
} from "../controllers/memberController";
import { requireAdminAuth } from "../middleware/auth";

const router = Router();

router.use(requireAdminAuth);

router.get("/", listMembers);
router.post("/", createMember);
router.get("/:memberId/biometrics", getMemberBiometrics);
router.post("/:memberId/biometrics", enrollMemberBiometric);

export default router;
