// ─── Job: Recordatorio Diario ────────────────────────────────────────────
// Todos los días a las 8 PM busca usuarias que no hayan registrado su
// DailyLog del día y les envía un correo + notificación por socket.
//
// Patrón cron: '0 20 * * *' = a las 20:00 todos los días
// Para pruebas durante desarrollo se puede poner '*/2 * * * *' (cada 2 min).

import cron from "node-cron";
import User from "../models/user.model";
import DailyLog from "../models/dailyLog.model";
import { dispatchDailyReminder } from "../services/notification.service";

const REMINDER_SCHEDULE = process.env.REMINDER_CRON || "0 20 * * *";

export const startDailyReminderJob = (): void => {
  if (!cron.validate(REMINDER_SCHEDULE)) {
    console.error(`[jobs] REMINDER_CRON inválido: ${REMINDER_SCHEDULE}`);
    return;
  }

  cron.schedule(REMINDER_SCHEDULE, async () => {
    console.log("[jobs] Ejecutando recordatorio diario...");

    try {
      // Calcular el rango del día actual (00:00 → 23:59)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay   = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Buscar todas las usuarias que SÍ registraron hoy
      const loggedToday = await DailyLog.find({
        date: { $gte: startOfDay, $lt: endOfDay }
      }).distinct("userId");

      // Encontrar las usuarias que NO están en esa lista
      const usersWithoutLog = await User.find({
        _id: { $nin: loggedToday }
      });

      console.log(`[jobs] ${usersWithoutLog.length} usuarias sin registro hoy`);

      // Despachar recordatorio a cada una
      for (const user of usersWithoutLog) {
        try {
          await dispatchDailyReminder(user);
        } catch (err: any) {
          console.error(`[jobs] Error enviando recordatorio a ${user.email}:`, err.message);
        }
      }

      console.log("[jobs] Recordatorio diario completado");
    } catch (err: any) {
      console.error("[jobs] Error en el job de recordatorio diario:", err.message);
    }
  });

  console.log(`[jobs] Recordatorio diario programado: '${REMINDER_SCHEDULE}'`);
};