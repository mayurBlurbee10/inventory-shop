import dotenv from "dotenv";
import { connectDatabase } from "./config/db.js";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { app } from "./app.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const port = parseInt(process.env.PORT || "5000", 10);
const host = process.env.HOST || "0.0.0.0";

const server = createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3025",
      "http://192.168.1.20:3001",
      process.env.NEXT_PUBLIC_APP_BASE_URL || "",
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true,
  },
  path: "/socket.io",
});

export const getIO = () => {
  if (!io) {
    return null;
  }
  return io;
};

initSocket(io);

connectDatabase()
  .then(() => {
    server.listen(port, host, () => {
      console.log(`Server is running on ${host}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
    server.listen(port, host, () => {
      console.log(`Server is running on ${host}:${port} (DB connection pending)`);
    });
  });

