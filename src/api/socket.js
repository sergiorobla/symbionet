import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://localhost:4000";
const socket = io(SOCKET_URL);

export function registerUser(userId) {
  if (!userId) return;
  socket.emit("registerUser", userId);
}

export function onUserDeleted(callback) {
  socket.on("userDeleted", callback);
  return () => {
    socket.off("userDeleted", callback);
  };
}

export default socket;
