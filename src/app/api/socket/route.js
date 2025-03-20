// import { Server } from "socket.io";
// import messageService from "@/services/messageService";
// import { verifyToken } from "@/app/lib/jwt";

// const onlineUsers = {}; // Store online users
// let io;

// export async function GET(req) {
//   if (!req.socket?.server) {
//     return new Response("Server is not ready", { status: 500 });
//   }

//   if (!req.socket.server.io) {
//     io = new Server(req.socket.server, {
//       path: "/api/socket",
//       cors: {
//         origin: "*", // Change to your frontend URL in production
//         methods: ["GET", "POST"],
//       },
//     });

//     console.log("✅ Socket.io Server Started");

//     // Middleware for Authentication
//     // io.use((socket, next) => {
//     //   const token = socket.handshake.auth?.token;
//     //   if (!token) return next(new Error("Authentication error"));

//     //   try {
//     //     const payload = verifyToken(token);
//     //     socket.user = payload;
//     //     next();
//     //   } catch (error) {
//     //     next(new Error("Invalid token"));
//     //   }
//     // });

//     io.on("connection", (socket) => {
//       console.log(`User connected: ${socket.user?.id}`);

//       // Handle user joining
//       socket.on("userJoined", (userId) => {
//         onlineUsers[userId] = socket.id;
//         io.emit("onlineUser", Object.keys(onlineUsers)); 
//       });

//       // Handle sending messages
//       socket.on("sendMessage", async (data) => {
//         const { sender, receiver, portalId } = data;
//         console.log(`📩 New message from ${sender} to ${receiver}`);

//         const messages = await messageService.getMessages(sender, receiver, portalId);

//         if (onlineUsers[receiver]) {
//           io.to(onlineUsers[receiver]).emit("newMessage", messages);
//         }

//         io.to(onlineUsers[sender]).emit("newMessage", messages);
//       });

//       // Fetch chat history
//       socket.on("getMessage", async (data) => {
//         const messages = await messageService.getMessages(
//           data.sender,
//           data.receiver,
//           data.portalId
//         );
//         socket.emit("message", messages);
//       });

//       // Handle user disconnect
//       socket.on("disconnect", () => {
//         const userId = Object.keys(onlineUsers).find(
//           (id) => onlineUsers[id] === socket.id
//         );

//         if (userId) {
//           delete onlineUsers[userId];
//           io.emit("onlineUser", Object.keys(onlineUsers));
//         }

//         console.log("❌ Client disconnected:", socket.id);
//       });
//     });

//     req.socket.server.io = io; 
//   }

//   return new Response("Socket server running");
// }
