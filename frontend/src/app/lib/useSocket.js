"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const getCookie = (name) => {
  if (typeof document === "undefined") return "";

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length !== 2) return "";

  return decodeURIComponent(parts.pop().split(";").shift() || "");
};

const getAccessToken = () => {
  if (typeof window === "undefined") return "";

  return (
    getCookie("token") ||
    getCookie("clientToken") ||
    getCookie("authToken") ||
    ""
  );
};

const getSocketUrl = () => {
  if (typeof window === "undefined") return null;

  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  if (!base) return null;

  try {
    const url = new URL(base);
    return url.origin;
  } catch {
    return base.replace(/\/$/, "");
  }
};

export function useSocket() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  useEffect(() => {
    const url = getSocketUrl();
    const token = getAccessToken();
    if (!url || !token) return;

    const socketClient = io(url, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    setSocket(socketClient);

    socketClient.on("connect", () => setConnected(true));
    socketClient.on("disconnect", () => setConnected(false));
    socketClient.on("connect_error", () => setConnected(false));
    socketClient.on("online_users", (payload) => {
      const userIds = Array.isArray(payload?.userIds) ? payload.userIds : [];
      setOnlineUserIds(userIds);
    });

    return () => {
      socketClient.off("online_users");
      socketClient.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUserIds([]);
    };
  }, []);

  return { socket, connected, onlineUserIds };
}
