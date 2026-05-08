// ─── Rutas de DailyLogs ──────────────────────────────────────────────────
// Mismo patrón que cycles: requireAuth global + requireOwnership en :id.

import express from "express";
import {
  getDailyLogs, getDailyLogById, createDailyLog, updateDailyLog, deleteDailyLog
} from "../controllers/dailyLog.controller";
import { requireAuth, requireOwnership } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuth);

router.get("/", getDailyLogs);
router.post("/", createDailyLog);

router.get("/:id", requireOwnership("DailyLog"), getDailyLogById);
router.put("/:id", requireOwnership("DailyLog"), updateDailyLog);
router.delete("/:id", requireOwnership("DailyLog"), deleteDailyLog);

export default router;