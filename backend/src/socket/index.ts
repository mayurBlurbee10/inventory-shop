import { Server as SocketServer } from "socket.io";
import { verifyToken } from "../utils/jwt.ts";
import userService from "../services/user.service.ts";
import messagesService from "../services/messages.service.ts";

export const getConversationRoomId = (
  portalId: string,
  userId1: string,
  userId2: string,
) => {
  const sorted = [userId1, userId2].sort();
  return `chat_${portalId}_${sorted[0]}_${sorted[1]}`;
};

const onlineUserConnections = new Map<string, number>();

const getOnlineUserIds = () => Array.from(onlineUserConnections.keys());

const markUserOnline = (io: SocketServer, userId: string) => {
  const connectionCount = onlineUserConnections.get(userId) || 0;
  onlineUserConnections.set(userId, connectionCount + 1);
  io.emit("online_users", { userIds: getOnlineUserIds() });
};

const markUserOffline = (io: SocketServer, userId: string) => {
  const connectionCount = onlineUserConnections.get(userId) || 0;

  if (connectionCount <= 1) {
    onlineUserConnections.delete(userId);
  } else {
    onlineUserConnections.set(userId, connectionCount - 1);
  }

  io.emit("online_users", { userIds: getOnlineUserIds() });
};

export const initSocket = (io: SocketServer) => {
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string) ||
        (socket.handshake.headers?.authorization?.replace?.(
          "Bearer ",
          "",
        ) as string);
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const decoded = await verifyToken(token);
      const payload = decoded as { id?: string };
      const user = await userService.getUserById(payload.id as string);
      if (!user) {
        return next(new Error("User not found"));
      }
      (socket as any).userId = (user as any).id;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId;
    console.log(`[Socket] User connected: ${userId}`);

    // Join private room so server can emit to this user (e.g. new_notification)
    socket.join(`user_${userId}`);
    markUserOnline(io, userId);

    socket.on(
      "join_conversation",
      (payload: { portalId: string; otherUserId: string }) => {
        const { portalId, otherUserId } = payload || {};
        if (!portalId || !otherUserId) {
          socket.emit("error", {
            message: "portalId and otherUserId required",
          });
          return;
        }
        const roomId = getConversationRoomId(portalId, userId, otherUserId);
        socket.join(roomId);
        socket.emit("joined_conversation", { roomId });
      },
    );

    socket.on(
      "leave_conversation",
      (payload: { portalId: string; otherUserId: string }) => {
        const { portalId, otherUserId } = payload || {};
        if (portalId && otherUserId) {
          const roomId = getConversationRoomId(portalId, userId, otherUserId);
          socket.leave(roomId);
        }
      },
    );

    socket.on(
      "send_message",
      async (payload: {
        receiverId: string;
        text: string;
        portalId: string;
      }) => {
        try {
          const { receiverId, text, portalId } = payload || {};
          if (!receiverId || !text?.trim() || !portalId) {
            socket.emit("error", {
              message: "receiverId, text and portalId required",
            });
            return;
          }
          const newMsg = await messagesService.createMessage({
            senderId: userId,
            receiverId,
            portalId,
            text: text.trim(),
          });
          const roomId = getConversationRoomId(portalId, userId, receiverId);
          const messagePayload = {
            id: (newMsg as any).id,
            text: (newMsg as any).text,
            senderId: userId,
            receiverId,
            portalId,
            createdAt: (newMsg as any).createdAt,
          };
          io.to(roomId).emit("new_message", messagePayload);
          // Notify receiver to refresh notification count (message creates in-app notification)
          io.to(`user_${receiverId}`).emit("new_notification");
        } catch (err) {
          console.error("[Socket] send_message error:", err);
          socket.emit("error", {
            message: "Failed to send message",
            details: (err as Error).message,
          });
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      markUserOffline(io, userId);
    });
  });
};
