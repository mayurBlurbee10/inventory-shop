import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  path: "/api/socket",
  transports: ["websocket", "polling"],
  // auth: {
  //   token: typeof window !== "undefined" ? localStorage.getItem("accessToken") : "",
  // },
  autoConnect: false, // Don't auto-connect immediately
  reconnection: true, // Enable reconnection
  reconnectionAttempts: 5, // Try reconnecting 5 times
  reconnectionDelay: 3000, // Wait 3 seconds before retry
  debug: true
});

export default socket;