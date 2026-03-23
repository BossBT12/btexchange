import { io } from "socket.io-client";

export function createSosSocket() {
  const socket = io(import.meta.env.VITE_API_BASE_URL.trim(), {
    transports: ["websocket"],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.warn("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection Error:", error.message);
  });

  socket.on("sosRoomJoined", ({ roomId, userId }) => {
    console.log(`[Socket] User ${userId} joined room ${roomId}`);
  });

  socket.on("receiveMessage", (data) => {
    console.log("[Socket] Message received:", data);
  });

  function joinRoom({ roomId, userId }) {
    if (!roomId || !userId) {
      console.warn("[Socket] joinRoom: roomId and userId are required");
      return;
    }
    console.log("[Socket] Joining room:", roomId);
    socket.emit("joinSosRoom", { roomId, userId });
  }

  function leaveRoom({ roomId, userId }) {
    if (!roomId || !userId) {
      console.warn("[Socket] leaveRoom: roomId and userId are required");

      return;
    }
    socket.emit("leaveSosRoom", { roomId, userId });
  }

  function sendMessage({ roomId, userId, content }) {
    if (!roomId || !userId || !content) {
      console.warn("[Socket] sendMessage: Missing roomId, userId, or content");
      return;
    }
    socket.emit("sendMessage", { roomId, userId, content });
  }

  function markMessageRead({ roomId, userId }) {
    console.log("markMessageRead", { roomId, userId });
    socket.emit("messageRead", { roomId, userId });
  }

  function on(event, callback) {
    socket.on(event, callback);
  }

  function off(event, callback) {
    socket.off(event, callback);
  }

  function disconnect() {
    if (socket.connected) {
      socket.disconnect();
      console.log("[Socket] Disconnected manually.");
    }
  }

  return {
    joinRoom,
    leaveRoom,
    sendMessage,
    markMessageRead,
    on,
    off,
    disconnect,
    socket,
  };
}
