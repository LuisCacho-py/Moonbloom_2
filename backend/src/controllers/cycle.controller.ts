// ─── Controller de Ciclos ────────────────────────────────────────────────
// Sprint 3: refactor para filtrar todos los queries por la usuaria autenticada
// (req.user._id) y emitir eventos por socket en cambios relevantes.

import { Request, Response } from "express";
import Cycle from "../models/cycle.model";
import { notifyCycleCreated, notifyCycleUpdated } from "../services/notification.service";

export const getCycles = async (req: Request, res: Response): Promise<void> => {
  // Solo los ciclos de la usuaria autenticada
  const cycles = await Cycle.find({ userId: req.user!._id })
    .sort({ startDate: -1 })
    .populate("userId", "name email");
  res.json(cycles);
};

export const getCycleById = async (req: Request, res: Response): Promise<void> => {
  // requireOwnership ya validó que el ciclo pertenece a la usuaria
  const cycle = await Cycle.findById(req.params.id).populate("userId", "name email");
  if (!cycle) { res.status(404); throw new Error("Ciclo no encontrado"); }
  res.json(cycle);
};

export const createCycle = async (req: Request, res: Response): Promise<void> => {
  // El userId siempre se toma de la sesión, NUNCA del body
  const cycle = new Cycle({ ...req.body, userId: req.user!._id });
  const savedCycle = await cycle.save();

  // Notificar a las otras pestañas/dispositivos de la usuaria
  notifyCycleCreated(req.user!._id.toString(), savedCycle);

  res.status(201).json(savedCycle);
};

export const updateCycle = async (req: Request, res: Response): Promise<void> => {
  // No permitimos cambiar el userId desde el body
  const { userId: _ignored, ...updateData } = req.body;

  const updated = await Cycle.findByIdAndUpdate(
    req.params.id,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) { res.status(404); throw new Error("Ciclo no encontrado"); }

  notifyCycleUpdated(req.user!._id.toString(), updated);

  res.json(updated);
};

export const deleteCycle = async (req: Request, res: Response): Promise<void> => {
  const deleted = await Cycle.findByIdAndDelete(req.params.id);
  if (!deleted) { res.status(404); throw new Error("Ciclo no encontrado"); }
  res.json({ message: "Ciclo eliminado correctamente" });
};