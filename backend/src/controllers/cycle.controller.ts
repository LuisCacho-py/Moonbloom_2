import { Request, Response } from "express";
import Cycle from "../models/cycle.model";
import { notifyCycleCreated, notifyCycleUpdated } from "../services/notification.service";

export const getCycles = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const userId = req.user!._id;
  const [cycles, total] = await Promise.all([
    Cycle.find({ userId }).sort({ startDate: -1 }).skip(skip).limit(limit).populate("userId", "name email"),
    Cycle.countDocuments({ userId }),
  ]);

  res.json({
    success: true,
    data: cycles,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getCycleById = async (req: Request, res: Response): Promise<void> => {
  const cycle = await Cycle.findById(req.params.id).populate("userId", "name email");
  if (!cycle) { res.status(404); throw new Error("Ciclo no encontrado"); }
  res.json({ success: true, data: cycle });
};

export const createCycle = async (req: Request, res: Response): Promise<void> => {
  const cycle = new Cycle({ ...req.body, userId: req.user!._id });
  const savedCycle = await cycle.save();

  notifyCycleCreated(req.user!._id.toString(), savedCycle);

  res.status(201).json({ success: true, data: savedCycle });
};

export const updateCycle = async (req: Request, res: Response): Promise<void> => {
  const { userId: _ignored, ...updateData } = req.body;

  const updated = await Cycle.findByIdAndUpdate(
    req.params.id,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) { res.status(404); throw new Error("Ciclo no encontrado"); }

  notifyCycleUpdated(req.user!._id.toString(), updated);

  res.json({ success: true, data: updated });
};

export const deleteCycle = async (req: Request, res: Response): Promise<void> => {
  const deleted = await Cycle.findByIdAndDelete(req.params.id);
  if (!deleted) { res.status(404); throw new Error("Ciclo no encontrado"); }
  res.json({ success: true, message: "Ciclo eliminado correctamente" });
};
