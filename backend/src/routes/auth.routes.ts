// ─── Rutas de Autenticación ──────────────────────────────────────────────
// API REST:  /api/auth/register, /login, /logout, /me, /google
// UI:        /login, /registro, /logout

import express from "express";
import passport from "../config/passport";
import {
  register, login, logout, me, googleCallback,
  renderLogin, renderRegister, loginUI, registerUI, logoutUI
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = express.Router();

// ── API REST ─────────────────────────────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

// ── Google OAuth flow ────────────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login?error=google"
  }),
  googleCallback
);

export default router;

// ── Sub-router para las rutas UI (form-based) ────────────────────────────
// Se exporta aparte para registrarlo bajo "/" en app.ts
export const authUIRouter = express.Router();

authUIRouter.get("/login", renderLogin);
authUIRouter.post("/login", loginUI);

authUIRouter.get("/registro", renderRegister);
authUIRouter.post("/registro", registerUI);

authUIRouter.get("/logout", logoutUI);
authUIRouter.post("/logout", logoutUI);