"use client";
import { useParams } from "next/navigation";
import { useSocket } from "provider/socketProvider";
import React, { useCallback, useEffect, useState } from "react";
import { usePeer } from "provider/peerProvider";

// Add these imports for icons
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaSync,
  FaDesktop,
} from "react-icons/fa";
import { useMedia } from "provider/mediaProvider";

export default function RoomPage() {
  const [remoteEmailId, setRemoteEmailId] = useState<string | null>(null);
  // const [localStream, setLocalStream] = React.useState<MediaStream | null>(
  //   null
  // );
  const [shareScreen, setShareScreen] = useState<MediaStreamTrack | null>(null);

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
    getSenderVideoTrack,
  } = usePeer();

  const {
    getUserMedia,
    localStream,
    getScreenTrack,
    replaceTrack,
    combineScreenAndCameraTrack,
  } = useMedia();

  // Add state to track audio/video enabled status
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoSend, setIsVideoSend] = useState<boolean>(false);

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);

  // Add toggle handlers
  const handleVideoToggle = useCallback(() => {
    if (!localStream) return;

    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsVideoEnabled(!isVideoEnabled);
  }, [localStream, isVideoEnabled]);

  const handleAudioToggle = useCallback(() => {
    if (!localStream) return;

    const audioTracks = localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setIsAudioEnabled(!isAudioEnabled);
  }, [localStream, isAudioEnabled]);

  const shareScreenHandler = async () => {
    try {
      // 1. Get the screen track
      // 2. Get the video sender
      // 3. Replace the track
      // 4. Combine the screen and camera track
      // 5. Show screen in local video element

      const screenTrack = await getScreenTrack();
      setShareScreen(screenTrack);

      if (peer && screenTrack) {
        const videoSender = getSenderVideoTrack();

        // Replace the track
        if (videoSender) {
          await replaceTrack(videoSender, screenTrack);
        }

        // Show screen in local video element
        if (localVideoRef.current) {
          const combineStream = await combineScreenAndCameraTrack(screenTrack);
          localVideoRef.current.srcObject = combineStream;
        }
      }
    } catch (error) {
      console.error("Unable to get share screen Stream:", error);
    }
  };

  const handleShareScreenEnd = useCallback(async () => {
    // Revert to camera when screen sharing ends
    if (localStream) {
      // Get camera video track
      const cameraTrack = localStream.getVideoTracks()[0];

      if (cameraTrack && peer) {
        const videoSender = getSenderVideoTrack();

        console.log("videoSender", videoSender);

        if (videoSender) {
          console.log("Reverted to camera video");
          await replaceTrack(videoSender, cameraTrack);
        }

        // Make sure camera track is enabled
        cameraTrack.enabled = isVideoEnabled;

        // Update local video display with original stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      }
    }
    setShareScreen(null);
  }, [getSenderVideoTrack, isVideoEnabled, localStream, peer, replaceTrack]);

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
    shareScreen?.addEventListener("ended", handleShareScreenEnd);

    return () => {
      console.log("🔌 Cleaning up listeners for socket:", socket.id);

      socket.off("incoming-call", handleIncomingCall);
      socket.off("user-joined", handleAnotherUserJoined);
      socket.off("call-accepted-by-calle", handleCallAccept);
      peer?.removeEventListener("negotiationneeded", handleNegotiationNeeded);
      shareScreen?.removeEventListener("ended", handleShareScreenEnd);
    };
  }, [
    socket,
    handleAnotherUserJoined,
    handleIncomingCall,
    handleCallAccept,
    peer,
    handleNegotiationNeeded,
    shareScreen,
    handleShareScreenEnd,
  ]);

  useEffect(() => {
    const initMedia = async () => {
      await getUserMedia();
      setIsLoading(false);
    };

    initMedia();
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

  // Show loading indicator
  if (isLoading) {
    return <div>Loading media devices...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1>You are connected to {remoteEmailId}</h1>
      <div className="flex flex-row gap-4">
        <div className="relative">
          <h2 className="mb-2">Local Stream</h2>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full bg-black rounded-lg"
          />
          <div className="absolute bottom-2 right-2 flex gap-2 ">
            <button
              className={`p-2 rounded-full ${
                isAudioEnabled ? "bg-green-500" : "bg-red-500"
              } text-white cursor-pointer`}
              onClick={handleAudioToggle}
              title={isAudioEnabled ? "Mute" : "Unmute"}
            >
              {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
            </button>
            <button
              className={`p-2 rounded-full ${
                isVideoEnabled ? "bg-green-500" : "bg-red-500"
              } text-white cursor-pointer`}
              onClick={handleVideoToggle}
              title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
            </button>

            {!shareScreen && (
              <button
                className="p-2 rounded-full bg-blue-500 text-white cursor-pointer"
                onClick={shareScreenHandler}
                title="Share Screen"
              >
                <FaDesktop />
              </button>
            )}

            {!isVideoSend && (
              <button
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2  max-w-xs mx-auto cursor-pointer"
                onClick={() => {
                  if (localStream) {
                    sendStream(localStream);
                    setIsVideoSend(true);
                  }
                }}
              >
                <FaSync className="h-5 w-5" />
                Send Video
              </button>
            )}
          </div>
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
    </div>
  );
}
