// ─── Rutas de Ciclos ─────────────────────────────────────────────────────
// Todas las rutas requieren autenticación.
// Las rutas con :id además validan ownership (que el ciclo sea de la usuaria).

import express from "express";
import {
  getCycles, getCycleById, createCycle, updateCycle, deleteCycle
} from "../controllers/cycle.controller";
import { requireAuth, requireOwnership } from "../middleware/auth.middleware";

const router = express.Router();

// Todas las rutas pasan primero por requireAuth
router.use(requireAuth);

router.get("/", getCycles);
router.post("/", createCycle);

// Rutas con :id requieren además ser la dueña del recurso
router.get("/:id", requireOwnership("Cycle"), getCycleById);
router.put("/:id", requireOwnership("Cycle"), updateCycle);
router.delete("/:id", requireOwnership("Cycle"), deleteCycle);

export default router;