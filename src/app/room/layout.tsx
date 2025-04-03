"use client";

import React from "react";
import MediaProvider from "provider/mediaProvider";

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="room-layout">
      <MediaProvider>{children}</MediaProvider>
    </div>
  );
}
