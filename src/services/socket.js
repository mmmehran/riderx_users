import { io } from "socket.io-client";

let socket = null;

// Keep track of the active room ID at module level
let activeRoomId = null;

export function connectSocket({ baseUrl, roomId }) {
  // Update the active room ID whenever connectSocket is called
  if (roomId) activeRoomId = roomId;

  if (socket && socket.connected) {
    // ⚠️ CRITICAL FIX: Even if already connected, ensure we join the correct room.
    // This handles scenarios where the user navigated away/back or the room subscription was lost.
    if (activeRoomId) {
      console.log("👉 Re-joining room on existing connection:", activeRoomId);
      socket.emit("join_room", { roomId: activeRoomId });
    }
    return socket;
  }

  socket = io(baseUrl, {
    transports: ["websocket", "polling"],
    query: { roomId: activeRoomId }, // Use activeRoomId
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 6000,
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.log("🔌 socket connected:", socket.id);

    // 🔽 join the room immediately after connect using the LATEST activeRoomId
    if (activeRoomId) {
      try {
        socket.emit("join_room", { roomId: activeRoomId }, (ack) => {
          console.log("📦 join_room ack:", ack);
        });
        console.log("👉 emitted join_room with", { roomId: activeRoomId });
      } catch (e) {
        console.log("⚠️ join_room emit failed:", e?.message);
      }
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
  return () => socket?.off(event, handler);
}

export function emit(event, payload, ack) {
  if (!socket) return;
  if (typeof ack === "function") {
    socket.emit(event, payload, ack);
  } else {
    socket.emit(event, payload);
  }
}
