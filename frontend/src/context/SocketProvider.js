"use client";
import socket from "../lib/socket";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    const connectSocket = () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
    };

    connectSocket();

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
