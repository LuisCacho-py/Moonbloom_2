import express from "express";
import {
  getDailyLogs, getDailyLogById, createDailyLog, updateDailyLog, deleteDailyLog
} from "../controllers/dailyLog.controller";
import { requireAuth, requireOwnership } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: DailyLogs
 *   description: Registros diarios de síntomas y estado
 */

/**
 * @swagger
 * /api/dailylogs:
 *   get:
 *     summary: Listar registros diarios de la usuaria autenticada
 *     tags: [DailyLogs]
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
 *         description: Lista paginada de registros
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DailyLog'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autenticada
 *   post:
 *     summary: Crear registro diario
 *     tags: [DailyLogs]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cycleId]
 *             properties:
 *               cycleId: { type: string }
 *               date: { type: string, format: date }
 *               mood:
 *                 type: string
 *                 enum: [feliz, triste, ansiosa, tranquila, enojada, cansada, sensible, normal]
 *               symptoms:
 *                 type: array
 *                 items: { type: string }
 *               flow: { type: number, minimum: 1, maximum: 5 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Registro creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/DailyLog'
 *       400:
 *         description: Datos inválidos
 */
router.get("/", getDailyLogs);
router.post("/", createDailyLog);

/**
 * @swagger
 * /api/dailylogs/{id}:
 *   get:
 *     summary: Obtener registro diario por ID
 *     tags: [DailyLogs]
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
 *         description: Registro encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   $ref: '#/components/schemas/DailyLog'
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Registro no encontrado
 *   put:
 *     summary: Actualizar registro diario
 *     tags: [DailyLogs]
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
 *               mood: { type: string }
 *               symptoms: { type: array, items: { type: string } }
 *               flow: { type: number }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Registro actualizado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Registro no encontrado
 *   delete:
 *     summary: Eliminar registro diario
 *     tags: [DailyLogs]
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
 *         description: Registro eliminado
 *       403:
 *         description: No tiene permiso
 *       404:
 *         description: Registro no encontrado
 */
router.get("/:id", requireOwnership("DailyLog"), getDailyLogById);
router.put("/:id", requireOwnership("DailyLog"), updateDailyLog);
router.delete("/:id", requireOwnership("DailyLog"), deleteDailyLog);

export default router;
