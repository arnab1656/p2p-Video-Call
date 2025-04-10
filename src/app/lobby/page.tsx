"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "provider/socketProvider";
import { useFireBase } from "provider/firebaseProvider";
import { generateRoomCode } from "utils/codeGenerator";
import { FaSync } from "react-icons/fa";

function LobbyPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const [roomID, setRoomID] = useState<string>("");

  const socket = useSocket();
  const router = useRouter();

  const { currentUser } = useFireBase();

  useEffect(() => {
    if (action === "create") {
      setRoomID(generateRoomCode());
    }
  }, [action]);

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
    if (!roomID) {
      alert("Enter the Room ID To Enter a Call");
      return;
    }

    socket?.emit("room-join", { email: currentUser?.email, roomID });
    router.push(`/room/${roomID}`);
  };

  useEffect(() => {
    socket?.on("room-joined", handleRoomJoined);
  }, [handleRoomJoined, socket]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4 p-6 border border-gray-200 rounded-md shadow-sm">
        <div className="flex gap-2 border border-gray-300 rounded-md">
          <input
            type="text"
            value={roomID}
            placeholder="Enter the Room-ID"
            onChange={(e) => {
              setRoomID(e.target.value);
            }}
            className="p-2 w-full"
            disabled={action === "create"}
          />
          {action === "create" && (
            <button
              onClick={() => {
                setRoomID(generateRoomCode());
              }}
              className="p-2"
            >
              <FaSync className="text-gray-500 cursor-pointer" />
            </button>
          )}
        </div>

        <button
          className="cursor-pointer border border-gray-300 rounded p-2 w-full hover:bg-gray-100"
          onClick={handleJoinToRoom}
        >
          {action === "create" ? "Create" : "Join"} the Room
        </button>
      </div>
    </div>
  );
}
export default LobbyPage;
