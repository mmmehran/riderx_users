import { io } from "socket.io-client";

let socket = null;

export function connectSocket({ baseUrl, roomId }) {
  if (socket && socket.connected) return socket;

  socket = io(baseUrl, {
    transports: ["websocket", "polling"],
    query: { roomId },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("🔌 socket connected:", socket.id);

    // 🔽 join the room immediately after connect
    try {
      socket.emit("join_room", { roomId }, (ack) => {
        console.log("📦 join_room ack:", ack);
      });
      console.log("👉 emitted join_room with", { roomId });
    } catch (e) {
      console.log("⚠️ join_room emit failed:", e?.message);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 socket disconnected:", reason);
  });
  socket.on("connect_error", (err) => {
    console.log("🔌 socket connect_error:", err?.message);
  });

  return socket;
}


export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

// helpers for events
export function on(event, handler) {
  if (!socket) return;
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function emit(event, payload, ack) {
  if (!socket) return;
  if (typeof ack === "function") {
    socket.emit(event, payload, ack);
  } else {
    socket.emit(event, payload);
  }
}
