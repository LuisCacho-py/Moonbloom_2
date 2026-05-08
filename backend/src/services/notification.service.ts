// ─── Servicio de Notificaciones ──────────────────────────────────────────
// Punto único de despacho de notificaciones. Decide a través de qué
// canales se envía cada evento (correo, socket en vivo, ambos).
//
// Esto evita que los controllers conozcan los detalles de cada canal:
// solo le piden a este servicio "notifica X a esta usuaria" y el servicio
// resuelve cómo entregarlo.

import { IUser } from "../models/user.model";
import { sendDailyReminderEmail, sendCyclePredictionEmail } from "./email.service";
import { emitToUser } from "../sockets";

// ── Recordatorio diario: correo + push por socket ───────────────────────
// El correo llega a quienes no tienen la app abierta;
// el socket llega a quienes sí, como toast en la UI.
export const dispatchDailyReminder = async (user: IUser): Promise<void> => {
  const userId = user._id.toString();

  emitToUser(userId, "reminder:daily", {
    title: "¿Cómo te sentiste hoy?",
    message: "No olvides registrar tu día en MoonBloom",
    actionUrl: "/registros/nuevo"
  });

  await sendDailyReminderEmail(user.email, user.name);
};

// ── Predicción de ciclo: correo + push ──────────────────────────────────
export const dispatchCyclePrediction = async (
  user: IUser,
  daysUntilNext: number
): Promise<void> => {
  const userId = user._id.toString();

  emitToUser(userId, "tip:wellness", {
    title: "Tu próximo ciclo se aproxima",
    message: `Podría comenzar en ${daysUntilNext} días`,
    actionUrl: "/dashboard"
  });

  await sendCyclePredictionEmail(user.email, user.name, daysUntilNext);
};

// ── Eventos en vivo: solo socket (sin correo) ───────────────────────────
// Se usan desde los controllers cuando una usuaria crea/edita algo, para
// que sus otras pestañas/dispositivos se actualicen al instante.
export const notifyLogCreated = (userId: string, log: any): void => {
  emitToUser(userId, "log:created", log);
};

export const notifyCycleCreated = (userId: string, cycle: any): void => {
  emitToUser(userId, "cycle:created", cycle);
};

export const notifyCycleUpdated = (userId: string, cycle: any): void => {
  emitToUser(userId, "cycle:updated", cycle);
};