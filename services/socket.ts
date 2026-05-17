import "dotenv/config";
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: Server | null = null;

/**
 * Initialise socket.io on the existing HTTP server.
 * JWT is verified during the handshake – unauthenticated clients are rejected.
 */
export const initSocketServer = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  // --- Authentication middleware (runs once per connection) ---
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: no token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      // Attach user payload so handlers can access it via socket.data.user
      socket.data.user = decoded;
      next();
    } catch {
      return next(new Error("Authentication error: invalid or expired token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user?.id;
    console.log(`[socket.io] User ${userId} connected  (socket ${socket.id})`);

    // Join a user-specific room so we can target pushes per-user
    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(
        `[socket.io] User ${userId} disconnected (${reason})`
      );
    });
  });

  console.log("[socket.io] Server initialised");
  return io;
};

/**
 * Return the current socket.io server instance.
 * Throws if called before initSocketServer().
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error(
      "socket.io has not been initialised – call initSocketServer() first"
    );
  }
  return io;
};
