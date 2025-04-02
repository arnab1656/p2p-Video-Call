"use client";

import React, { ReactNode } from "react";
import { io, Socket } from "socket.io-client";

export const SocketContext = React.createContext<Socket | null>(null);

export const useSocket = () => {
  return React.useContext(SocketContext);
};
interface SocketProviderProps {
  children: ReactNode;
}
export const SocketProvider = (props: SocketProviderProps) => {
  const socket = React.useMemo(
    () => io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8081"),
    []
  );
  return (
    <SocketContext.Provider value={socket}>
      {props.children}
    </SocketContext.Provider>
  );
};
