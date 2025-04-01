"use client";
import { useParams } from "next/navigation";
import { useSocket } from "provider/socketProvider";
import React, { useCallback, useEffect, useState } from "react";
import { usePeer } from "provider/peerProvider";

export default function RoomPage() {
  const [remoteEmailId, setRemoteEmailId] = useState<string | null>(null);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(
    null
  );

  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);

  const params = useParams();
  const roomId = params.roomId as string;
  const socket = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    incomingRemoteStream,
    connectionState,
  } = usePeer();

  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
    } catch (error) {
      console.error("no devide found ", error);
    }
  }, []);

  const handleAnotherUserJoined = useCallback(
    async ({ email, roomID }: { email: string; roomID: string }) => {
      try {
        // The Email Id of the Calle
        setRemoteEmailId(email);

        const offer = await createOffer();
        socket?.emit("call-user", { email, offer });
      } catch (error) {
        console.error("❌ Error in handleAnotherUserJoined:", error);
      }
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data: { callerEmail: string; offer: RTCSessionDescriptionInit }) => {
      try {
        const { callerEmail, offer } = data;
        setRemoteEmailId(callerEmail);
        console.log("📞 Incoming call with offer:", offer);

        const ans = await createAnswer(offer);
        console.log("📤 Created answer:", ans);

        socket?.emit("call-accepted", { callerEmail, ans });
      } catch (error) {
        console.error("❌ Error handling incoming call:", error);
      }
    },
    [createAnswer, socket]
  );

  const handleCallAccept = useCallback(
    async ({ ans }: { ans: RTCSessionDescriptionInit }) => {
      await setRemoteAns(ans);
      console.log(
        "The loop of connection is Done Means Caller connected to the Calle"
      );
    },
    [setRemoteAns]
  );

  const handleNegotiationNeeded = useCallback(async () => {
    try {
      console.log("💡 Negotiation needed, created offer:");

      const negotiationOffer = await createOffer();
      socket?.emit("call-user", {
        email: remoteEmailId,
        offer: {
          // Make sure offer has correct type
          type: "offer",
          sdp: negotiationOffer.sdp,
        },
      });
    } catch (error) {
      console.error("❌ Error during negotiation:", error);
    }
  }, [createOffer, remoteEmailId, socket]);

  useEffect(() => {
    if (!socket) return;

    console.log("🔌 Setting up listeners for socket:", socket.id);

    socket.on("incoming-call", handleIncomingCall);
    socket.on("user-joined", handleAnotherUserJoined);
    socket.on("call-accepted-by-calle", handleCallAccept);
    peer?.addEventListener("negotiationneeded", handleNegotiationNeeded);

    return () => {
      console.log("🔌 Cleaning up listeners for socket:", socket.id);

      socket.off("incoming-call", handleIncomingCall);
      socket.off("user-joined", handleAnotherUserJoined);
      socket.off("call-accepted-by-calle", handleCallAccept);
      peer?.removeEventListener("negotiationneeded", handleNegotiationNeeded);
    };
  }, [
    socket,
    handleAnotherUserJoined,
    handleIncomingCall,
    handleCallAccept,
    peer,
    handleNegotiationNeeded,
  ]);

  useEffect(() => {
    getUserMedia();
  }, [getUserMedia]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && incomingRemoteStream) {
      remoteVideoRef.current.srcObject = incomingRemoteStream;
    }
  }, [incomingRemoteStream]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1>You are connected to {remoteEmailId}</h1>
      <div className="flex flex-row gap-4">
        <div>
          <h2 className="mb-2">Local Stream</h2>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full bg-black rounded-lg"
          />
        </div>
        <div className="relative">
          <h2 className="mb-2">Remote Stream</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full bg-black rounded-lg"
            // muted
          />
          {connectionState !== "connected" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <p className="text-white">
                {connectionState === "connecting"
                  ? "Establishing connection..."
                  : "Waiting for connection..."}
              </p>
            </div>
          )}
        </div>
      </div>
      <button
        className="cursor-pointer"
        onClick={() => {
          if (localStream) {
            sendStream(localStream);
          }
        }}
      >
        Resend Video
      </button>
    </div>
  );
}
