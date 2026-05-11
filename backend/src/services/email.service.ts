// ─── Servicio de Correo Electrónico ──────────────────────────────────────
// Encapsula el envío de correos usando Nodemailer + Handlebars.
// Soporta Gmail SMTP, Mailtrap (desarrollo) o cualquier proveedor SMTP.
//
// Si no hay SMTP configurado, los correos se imprimen en consola
// (útil para desarrollo).

import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

let transporter: Transporter | null = null;

// ── Inicialización lazy del transporter ──────────────────────────────────
const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[email] SMTP no configurado — los correos se mostrarán en consola");
    // Transporter de desarrollo: solo imprime en consola
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  return transporter;
};

// ── Helper: carga y compila un template Handlebars ──────────────────────
const templateCache: Record<string, HandlebarsTemplateDelegate> = {};

const renderTemplate = (templateName: string, data: object): string => {
  if (!templateCache[templateName]) {
    const filePath = path.join(__dirname, "..", "..", "templates", "email", `${templateName}.hbs`);
    const source = fs.readFileSync(filePath, "utf-8");
    templateCache[templateName] = Handlebars.compile(source);
  }
  return templateCache[templateName](data);
};

// ── Envío genérico ───────────────────────────────────────────────────────
interface SendEmailOpts {
  to: string;
  subject: string;
  template: string;            // nombre del archivo .hbs sin extensión
  data: object;                // variables que se inyectan en el template
}

export const sendEmail = async ({ to, subject, template, data }: SendEmailOpts): Promise<void> => {
  const html = renderTemplate(template, data);
  const from = process.env.EMAIL_FROM || "MoonBloom <noreply@moonbloom.tech>";

  const info = await getTransporter().sendMail({ from, to, subject, html });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[email] enviado a ${to} — asunto: "${subject}"`);
    if ((info as any).message) {
      // jsonTransport: muestra el contenido completo en dev sin SMTP
      console.log("[email] contenido:", (info as any).message.toString().slice(0, 200));
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────
// Funciones de alto nivel — una por tipo de correo
// ─────────────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (to: string, name: string): Promise<void> => {
  await sendEmail({
    to,
    subject: "🌸 Bienvenida a MoonBloom",
    template: "welcome",
    data: {
      name,
      appUrl: process.env.APP_URL || "http://localhost:3000"
    }
  });
};

export const sendDailyReminderEmail = async (
  to: string,
  name: string
): Promise<void> => {
  await sendEmail({
    to,
    subject: "🌙 No olvides registrar tu día",
    template: "daily-reminder",
    data: {
      name,
      appUrl: process.env.APP_URL || "http://localhost:3000",
      dateStr: new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    }
  });
};

export const sendCyclePredictionEmail = async (
  to: string,
  name: string,
  daysUntilNext: number
): Promise<void> => {
  await sendEmail({
    to,
    subject: `🌸 Tu próximo ciclo se aproxima en ${daysUntilNext} días`,
    template: "cycle-prediction",
    data: {
      name,
      daysUntilNext,
      appUrl: process.env.APP_URL || "http://localhost:3000"
    }
  });
};