"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const SocketContext = React.createContext<Socket | null>(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = (props: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8081";

    if (!socket) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      setSocket(socket);
    }

    socket?.on("connect", () => {
      console.log("Socket connected with ID:", socket?.id);
    });

    socket?.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }, [socket]);

  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
