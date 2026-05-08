// ─── Setup de Socket.io ──────────────────────────────────────────────────
// Establece comunicación en tiempo real entre el servidor y los clientes.
// Cada usuaria autenticada se une a un room privado (su userId) para
// poder recibir notificaciones dirigidas solo a ella.
//
// Eventos soportados:
//   server → cliente:
//     'log:created'       → se creó un nuevo DailyLog (sync multi-dispositivo)
//     'cycle:created'     → se creó un nuevo Cycle
//     'cycle:updated'     → se actualizó un Cycle
//     'reminder:daily'    → recordatorio empujado por el job de las 8pm
//     'tip:wellness'      → consejo de bienestar del día

import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model";

let io: SocketIOServer | null = null;

// ── Inicialización ───────────────────────────────────────────────────────
export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true
    }
  });

  // ── Middleware de autenticación para sockets ──────────────────────────
  // El cliente debe enviar el JWT en handshake.auth.token o como cookie.
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Fallback: leer cookie 'token' del header
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(";");
        const tokenCookie = cookies.find(c => c.trim().startsWith("token="));
        if (tokenCookie) token = tokenCookie.split("=")[1];
      }

      if (!token) return next(new Error("No autenticado"));

      const secret = process.env.JWT_SECRET;
      if (!secret) return next(new Error("JWT_SECRET no configurado"));

      const decoded = jwt.verify(token, secret) as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error("Usuaria no encontrada"));

      // Adjuntamos el userId al socket para usarlo en los handlers
      (socket as any).userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error("Token inválido"));
    }
  });

  // ── Handler de conexión ───────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`[socket] Usuaria ${userId} conectada (${socket.id})`);

    // Cada usuaria entra a un room con su propio userId.
    // Así podemos mandarle eventos solo a ella desde otros lugares del backend.
    socket.join(userId);

    socket.on("disconnect", () => {
      console.log(`[socket] Usuaria ${userId} desconectada`);
    });

    // Saludo inicial — útil para que el cliente confirme que la conexión funciona.
    socket.emit("connected", { message: "Conectada a MoonBloom en tiempo real" });
  });

  console.log("[socket] Socket.io inicializado");
  return io;
};

// ── Helpers para emitir desde cualquier parte del backend ───────────────
// Estos los consume notification.service.ts cuando ocurre algo relevante.

export const emitToUser = (userId: string, event: string, payload: any): void => {
  if (!io) {
    console.warn("[socket] Intento de emitir antes de inicializar");
    return;
  }
  io.to(userId).emit(event, payload);
};

export const getIO = (): SocketIOServer | null => io;