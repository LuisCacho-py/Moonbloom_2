import express from "express";
import {
  getCycles, getCycleById, createCycle, updateCycle, deleteCycle
} from "../controllers/cycle.controller";
import { requireAuth, requireOwnership } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Cycles
 *   description: Gestión de ciclos menstruales
 */

/**
 * @swagger
 * /api/cycles:
 *   get:
 *     summary: Listar ciclos de la usuaria autenticada
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de ciclos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Cycle'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autenticada
 *   post:
 *     summary: Crear un nuevo ciclo
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [startDate]
 *             properties:
 *               startDate: { type: string, format: date, example: "2025-05-01" }
 *               endDate: { type: string, format: date, example: "2025-05-05" }
 *               durationDays: { type: number, example: 4 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Ciclo creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Cycle'
 *       400:
 *         description: Datos inválidos
 */
router.get("/", getCycles);
router.post("/", createCycle);

/**
 * @swagger
 * /api/cycles/{id}:
 *   get:
 *     summary: Obtener ciclo por ID
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ciclo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/Cycle'
 *       403:
 *         description: No tiene permiso sobre este recurso
 *       404:
 *         description: Ciclo no encontrado
 *   put:
 *     summary: Actualizar ciclo
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate: { type: string, format: date }
 *               endDate: { type: string, format: date }
 *               durationDays: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Ciclo actualizado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Ciclo no encontrado
 *   delete:
 *     summary: Eliminar ciclo
 *     tags: [Cycles]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ciclo eliminado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Ciclo no encontrado
 */
router.get("/:id", requireOwnership("Cycle"), getCycleById);
router.put("/:id", requireOwnership("Cycle"), updateCycle);
router.delete("/:id", requireOwnership("Cycle"), deleteCycle);

export default router;
