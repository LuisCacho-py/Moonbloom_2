// ─── Punto de entrada del servidor MoonBloom ─────────────────────────────
// Sprint 3: integración de autenticación JWT + Google OAuth, sockets y jobs.

// dotenv debe ser la PRIMERA línea
import "dotenv/config";

import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { engine } from "express-handlebars";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

import connectDB from "./config/db";
import passport from "./config/passport";
import { errorHandler } from "./middleware/error.middleware";
import { initSocketServer } from "./sockets";
import { startAllJobs } from "./jobs";

const app = express();

// ── Motor de plantillas ──────────────────────────────────────────────────
app.engine(
  "handlebars",
  engine({
    layoutsDir: path.join(__dirname, "views", "layouts"),
    defaultLayout: "main",
    extname: ".handlebars",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      eq: (a: any, b: any) => String(a) === String(b),
      formatDate: (date: Date | string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-MX", {
          year: "numeric", month: "long", day: "numeric"
        });
      },
      toString: (val: any) => String(val),
    }
  })
);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// ── Archivos estáticos ───────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));

// ── Middleware Global ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ── Rutas REST (API) ─────────────────────────────────────────────────────
import authRoutes, { authUIRouter } from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import cycleRoutes from "./routes/cycle.routes";
import dailyLogRoutes from "./routes/dailyLog.routes";

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/cycles",    cycleRoutes);
app.use("/api/dailylogs", dailyLogRoutes);

// ── Documentación Swagger ────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Rutas UI (Handlebars) ────────────────────────────────────────────────
import uiRoutes from "./routes/ui.routes";
app.use("/", authUIRouter);
app.use("/", uiRoutes);

// ── Manejo Global de Errores ─────────────────────────────────────────────
app.use(errorHandler);

// ── Arrancar servidor + Socket.io + Jobs ─────────────────────────────────
const PORT: number = Number(process.env.PORT) || 3000;
const httpServer = http.createServer(app);

initSocketServer(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🌸 MoonBloom corriendo en http://localhost:${PORT}`);
    startAllJobs();
  });
});