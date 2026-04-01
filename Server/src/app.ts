import cors from "cors";
import express from "express";

import adminAuthRoutes from "./routes/adminAuthRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import departmentRoutes from "./routes/departmentRoutes";
import memberRoutes from "./routes/memberRoutes";
import scannerAttendanceRoutes from "./routes/scannerAttendanceRoutes";
import scannerAuthRoutes from "./routes/scannerAuthRoutes";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "church-attendance-backend",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/scanner/auth", scannerAuthRoutes);
app.use("/api/scanner/attendance", scannerAttendanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  },
);

export default app;
