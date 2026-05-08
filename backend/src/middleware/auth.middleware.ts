// ─── Middleware de Autenticación ─────────────────────────────────────────
// Valida JWT desde cookie 'token' o header Authorization Bearer.
// Inyecta req.user con la usuaria autenticada.

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User, { IUser } from "../models/user.model";

// Extiende Express.User para que req.user tenga los campos de IUser
declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends IUser {}
  }
}

// Genera un JWT para una usuaria
export const signToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET no está configurado");
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  } as jwt.SignOptions);
};

// Bloquea si no hay JWT válido (uso en API REST)
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: "No autenticado: falta el token" });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está configurado");

    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ success: false, message: "Usuaria no encontrada" });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
};

// Igual que requireAuth pero redirige a /login (uso en Handlebars)
export const requireAuthUI = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;
    if (!token) { res.redirect("/login"); return; }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET no está configurado");

    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user) { res.redirect("/login"); return; }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    res.clearCookie("token");
    res.redirect("/login");
  }
};

// Valida que el recurso pertenezca a la usuaria autenticada
export const requireOwnership = (
  modelName: "Cycle" | "DailyLog",
  paramName: string = "id"
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "No autenticado" });
        return;
      }

      const Model = mongoose.model(modelName);
      const resource: any = await Model.findById(req.params[paramName]);
      if (!resource) {
        res.status(404).json({ success: false, message: `${modelName} no encontrado` });
        return;
      }

      if (resource.userId.toString() !== req.user._id.toString()) {
        res.status(403).json({
          success: false,
          message: "No tienes permiso para acceder a este recurso"
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};