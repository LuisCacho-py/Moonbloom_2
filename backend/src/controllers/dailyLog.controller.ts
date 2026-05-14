import { Request, Response } from "express";
import DailyLog from "../models/dailyLog.model";
import { notifyLogCreated } from "../services/notification.service";

export const getDailyLogs = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const userId = req.user!._id;
  const [logs, total] = await Promise.all([
    DailyLog.find({ userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("cycleId", "startDate endDate durationDays"),
    DailyLog.countDocuments({ userId }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getDailyLogById = async (req: Request, res: Response): Promise<void> => {
  const log = await DailyLog.findById(req.params.id)
    .populate("userId", "name email")
    .populate("cycleId", "startDate endDate durationDays");
  if (!log) { res.status(404); throw new Error("Registro diario no encontrado"); }
  res.json({ success: true, data: log });
};

export const createDailyLog = async (req: Request, res: Response): Promise<void> => {
  const log = new DailyLog({ ...req.body, userId: req.user!._id });
  const savedLog = await log.save();

  notifyLogCreated(req.user!._id.toString(), savedLog);

  res.status(201).json({ success: true, data: savedLog });
};

export const updateDailyLog = async (req: Request, res: Response): Promise<void> => {
  const { userId: _ignored, ...updateData } = req.body;

  const updated = await DailyLog.findByIdAndUpdate(
    req.params.id,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
  if (!updated) { res.status(404); throw new Error("Registro diario no encontrado"); }
  res.json({ success: true, data: updated });
};

export const deleteDailyLog = async (req: Request, res: Response): Promise<void> => {
  const deleted = await DailyLog.findByIdAndDelete(req.params.id);
  if (!deleted) { res.status(404); throw new Error("Registro diario no encontrado"); }
  res.json({ success: true, message: "Registro diario eliminado correctamente" });
};
