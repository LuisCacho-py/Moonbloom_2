import express, { Request, Response, NextFunction } from "express";
import Cycle from "../models/cycle.model";
import DailyLog from "../models/dailyLog.model";
import User from "../models/user.model";
import { requireAuthUI } from "../middleware/auth.middleware";

const router = express.Router();

router.use(requireAuthUI);

// ── Helpers ───────────────────────────────────────────────────────────────
function toISODate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user!.role === "admin") { next(); return; }
  res.redirect("/dashboard");
}

function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.params.id === req.user!._id.toString() || req.user!.role === "admin") {
    next(); return;
  }
  res.redirect("/dashboard");
}

// ── Dashboard ─────────────────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response): void => {
  res.redirect("/dashboard");
});

router.get("/dashboard", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const [lastCycle, totalCycles, totalLogs, lastLog] = await Promise.all([
      Cycle.findOne({ userId }).sort({ startDate: -1 }).lean(),
      Cycle.countDocuments({ userId }),
      DailyLog.countDocuments({ userId }),
      DailyLog.findOne({ userId }).sort({ date: -1 }).lean(),
    ]);
    res.render("dashboard", { lastCycle, totalCycles, totalLogs, lastLog });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// ── Ciclos ────────────────────────────────────────────────────────────────
router.get("/ciclos/nuevo", (_req: Request, res: Response): void => {
  res.render("cycles/create");
});

router.post("/ciclos/nuevo", async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, durationDays, notes } = req.body;
    const cycle = new Cycle({
      userId: req.user!._id,
      startDate,
      endDate: endDate || undefined,
      durationDays: durationDays ? Number(durationDays) : undefined,
      notes,
    });
    await cycle.save();
    res.redirect("/calendario");
  } catch (error: any) {
    const messages =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((e: any) => e.message).join(", ")
        : error.message;
    res.render("cycles/create", { error: messages });
  }
});

router.get("/ciclos/:id/editar", async (req: Request, res: Response): Promise<void> => {
  try {
    const cycle: any = await Cycle.findOne({ _id: req.params.id, userId: req.user!._id }).lean();
    if (!cycle) { res.redirect("/calendario"); return; }
    cycle.startDateISO = toISODate(cycle.startDate);
    cycle.endDateISO = toISODate(cycle.endDate);
    res.render("cycles/edit", { cycle });
  } catch {
    res.redirect("/calendario");
  }
});

router.post("/ciclos/:id/editar", async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, durationDays, notes } = req.body;
    await Cycle.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { startDate, endDate: endDate || null, durationDays: durationDays ? Number(durationDays) : null, notes },
      { runValidators: true }
    );
    res.redirect("/calendario");
  } catch (error: any) {
    const cycle: any = await Cycle.findOne({ _id: req.params.id, userId: req.user!._id }).lean();
    if (cycle) { cycle.startDateISO = toISODate(cycle.startDate); cycle.endDateISO = toISODate(cycle.endDate); }
    res.render("cycles/edit", { error: error.message, cycle });
  }
});

router.post("/ciclos/:id/eliminar", async (req: Request, res: Response): Promise<void> => {
  await Cycle.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
  res.redirect("/calendario");
});

// ── Calendario ────────────────────────────────────────────────────────────
router.get("/calendario", async (req: Request, res: Response): Promise<void> => {
  try {
    const cycles = await Cycle.find({ userId: req.user!._id }).sort({ startDate: -1 }).lean();
    res.render("calendar", { cycles });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// ── Registros Diarios ─────────────────────────────────────────────────────
router.get("/registros", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const logs = await DailyLog.find({ userId })
      .sort({ date: -1 })
      .populate("cycleId", "startDate endDate")
      .lean();
    res.render("logs/index", { logs });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

router.get("/registros/nuevo", async (req: Request, res: Response): Promise<void> => {
  try {
    const cycles = await Cycle.find({ userId: req.user!._id }).sort({ startDate: -1 }).lean();
    res.render("logs/create", { cycles });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

router.post("/registros/nuevo", async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId, date, mood, symptoms, flow, notes } = req.body;
    const log = new DailyLog({
      userId: req.user!._id,
      cycleId,
      date,
      mood,
      symptoms: symptoms ? (symptoms as string).split(",").map((s: string) => s.trim()) : [],
      flow: flow ? Number(flow) : undefined,
      notes,
    });
    await log.save();
    res.redirect("/registros");
  } catch (error: any) {
    const cycles = await Cycle.find({ userId: req.user!._id }).lean();
    const messages =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((e: any) => e.message).join(", ")
        : error.message;
    res.render("logs/create", { error: messages, cycles });
  }
});

router.get("/registros/:id/editar", async (req: Request, res: Response): Promise<void> => {
  try {
    const log: any = await DailyLog.findOne({ _id: req.params.id, userId: req.user!._id }).lean();
    if (!log) { res.redirect("/registros"); return; }
    const cycles = await Cycle.find({ userId: req.user!._id }).sort({ startDate: -1 }).lean();
    log.dateISO = toISODate(log.date);
    log.symptomsJoined = (log.symptoms || []).join(", ");
    res.render("logs/edit", { log, cycles });
  } catch {
    res.redirect("/registros");
  }
});

router.post("/registros/:id/editar", async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId, date, mood, symptoms, flow, notes } = req.body;
    await DailyLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      {
        cycleId,
        date,
        mood,
        symptoms: symptoms ? (symptoms as string).split(",").map((s: string) => s.trim()) : [],
        flow: flow ? Number(flow) : undefined,
        notes,
      },
      { runValidators: true }
    );
    res.redirect("/registros");
  } catch (error: any) {
    const log: any = await DailyLog.findOne({ _id: req.params.id, userId: req.user!._id }).lean();
    const cycles = await Cycle.find({ userId: req.user!._id }).lean();
    if (log) { log.dateISO = toISODate(log.date); log.symptomsJoined = (log.symptoms || []).join(", "); }
    res.render("logs/edit", { error: error.message, log, cycles });
  }
});

router.post("/registros/:id/eliminar", async (req: Request, res: Response): Promise<void> => {
  await DailyLog.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
  res.redirect("/registros");
});

// ── Perfil propio ─────────────────────────────────────────────────────────
router.get("/perfil", async (req: Request, res: Response): Promise<void> => {
  try {
    const user: any = await User.findById(req.user!._id).lean();
    if (!user) { res.redirect("/dashboard"); return; }
    user.idStr = user._id.toString();
    res.render("users/edit", { user, isSelf: true });
  } catch {
    res.redirect("/dashboard");
  }
});

// ── Usuarias (solo admin) ─────────────────────────────────────────────────
router.get("/usuarios", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const raw = await User.find().sort({ createdAt: -1 }).lean();
    const users = raw.map((u: any) => ({ ...u, idStr: u._id.toString() }));
    res.render("users/index", { users, count: users.length });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

router.get("/usuarios/nuevo", requireAdmin, (_req: Request, res: Response): void => {
  res.render("users/create");
});

router.post("/usuarios/nuevo", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = new User(req.body);
    await user.save();
    res.redirect("/usuarios");
  } catch (error: any) {
    const messages =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((e: any) => e.message).join(", ")
        : error.code === 11000
        ? "El correo electrónico ya está registrado."
        : error.message;
    res.render("users/create", { error: messages });
  }
});

router.get("/usuarios/:id/editar", requireSelfOrAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const user: any = await User.findById(req.params.id).lean();
    if (!user) { res.redirect("/usuarios"); return; }
    user.idStr = user._id.toString();
    const isSelf = req.params.id === req.user!._id.toString();
    res.render("users/edit", { user, isSelf });
  } catch {
    res.redirect("/usuarios");
  }
});

router.post("/usuarios/:id/editar", requireSelfOrAdmin, async (req: Request, res: Response): Promise<void> => {
  const isSelf = req.params.id === req.user!._id.toString();
  try {
    const { name, email, password } = req.body;
    const userDoc = await User.findById(req.params.id);
    if (!userDoc) { res.redirect(isSelf ? "/perfil" : "/usuarios"); return; }
    userDoc.name = name;
    userDoc.email = email;
    if (password && password.trim()) userDoc.password = password.trim();
    await userDoc.save();
    res.redirect(isSelf ? "/perfil" : "/usuarios");
  } catch (error: any) {
    const user: any = await User.findById(req.params.id).lean();
    if (user) user.idStr = user._id.toString();
    const messages =
      error.name === "ValidationError"
        ? Object.values(error.errors).map((e: any) => e.message).join(", ")
        : error.message;
    res.render("users/edit", { error: messages, user, isSelf });
  }
});

router.post("/usuarios/:id/eliminar", requireSelfOrAdmin, async (req: Request, res: Response): Promise<void> => {
  const isSelf = req.params.id === req.user!._id.toString();
  await User.findByIdAndDelete(req.params.id);
  if (isSelf) {
    res.clearCookie("token");
    res.redirect("/login");
  } else {
    res.redirect("/usuarios");
  }
});

export default router;
