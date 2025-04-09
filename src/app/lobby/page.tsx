"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "provider/socketProvider";

function LobbyPage() {
  const [email, setEmail] = useState<string>("");
  const [roomID, setRoomID] = useState<string>("");

  const socket = useSocket();
  const router = useRouter();

  const handleRoomJoined = useCallback(
    (roomID: string) => {
      console.log(
        "Joined the Room id with",
        roomID,
        " and the join loop is complete for socket with ID ",
        socket?.id
      );
    },
    [socket]
  );

  const handleJoinToRoom = () => {
    if (!email || !roomID) {
      alert("Enter the Email ID and the Room ID To Enter a Call");
      return;
    }
    socket?.emit("room-join", { email, roomID });
    router.push(`/room/${roomID}`);
  };

  useEffect(() => {
    socket?.on("room-joined", handleRoomJoined);
  }, [handleRoomJoined, socket]);

  return (
    <div>
      <div>
        <input
          type="text"
          value={email}
          placeholder="Enter your email"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <input
          type="text"
          value={roomID}
          placeholder="Enter the Room ID"
          onChange={(e) => {
            setRoomID(e.target.value);
          }}
        />
        <button className="cursor-pointer" onClick={handleJoinToRoom}>
          Enter the Room
        </button>
      </div>
    </div>
  );
}
export default LobbyPage;
