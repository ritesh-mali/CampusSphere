const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

/**
 * Attach Socket.io with JWT auth (pass token in handshake.auth.token).
 */
function initCampusSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
      if (!token) {
        return next(new Error("auth_required"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) {
        return next(new Error("invalid_token"));
      }
      socket.userId = String(decoded.userId);
      next();
    } catch (e) {
      next(new Error("invalid_token"));
    }
  });

  io.on("connection", (socket) => {
    const room = `user_${socket.userId}`;
    socket.join(room);
    socket.emit("campus_socket_ready", { room });
  });

  return io;
}

module.exports = { initCampusSocket };
