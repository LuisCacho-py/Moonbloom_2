import express from "express";
import rateLimit from "express-rate-limit";
import passport from "../config/passport";
import {
  register, login, logout, me, googleCallback,
  renderLogin, renderRegister, loginUI, registerUI, logoutUI
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y sesión de usuario
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nueva usuaria
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: María López
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@ejemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secreto123
 *     responses:
 *       201:
 *         description: Usuaria registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o email ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@ejemplo.com
 *               password:
 *                 type: string
 *                 example: secreto123
 *     responses:
 *       200:
 *         description: Login exitoso. Token enviado en cookie httpOnly.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Demasiados intentos
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada, cookie eliminada
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener usuaria autenticada
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos de la usuaria actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autenticada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", requireAuth, me);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Iniciar flujo de autenticación con Google
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirección a Google OAuth
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Callback de Google OAuth
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirección al dashboard tras login exitoso
 */
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
export const authUIRouter = express.Router();

authUIRouter.get("/login", renderLogin);
authUIRouter.post("/login", loginUI);

authUIRouter.get("/registro", renderRegister);
authUIRouter.post("/registro", registerUI);

authUIRouter.get("/logout", logoutUI);
authUIRouter.post("/logout", logoutUI);
