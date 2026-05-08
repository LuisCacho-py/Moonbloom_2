// ─── Registro de Jobs Programados ────────────────────────────────────────
// Punto único donde se registran todos los cron jobs de la aplicación.
// Se invoca desde app.ts una vez que el servidor está listo.

import { startDailyReminderJob } from "./reminder.job";

export const startAllJobs = (): void => {
  // Permite desactivar los jobs con DISABLE_JOBS=true (útil en tests).
  if (process.env.DISABLE_JOBS === "true") {
    console.log("[jobs] Jobs desactivados por configuración");
    return;
  }

  startDailyReminderJob();

  // Espacio para futuros jobs:
  // startCyclePredictionJob();
  // startMonthlySummaryJob();
};