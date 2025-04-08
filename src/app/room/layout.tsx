"use client";

import React from "react";
import MediaProvider from "provider/mediaProvider";
import { PeerProvider } from "provider/peerProvider";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="room-layout">
      <MediaProvider>
        <PeerProvider>{children}</PeerProvider>
      </MediaProvider>
    </div>
  );
}
