"use client";

import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { useSocket } from "./socketProvider";
import { useMedia } from "./mediaProvider";

interface PeerContextType {
  peer: RTCPeerConnection | null;
  createOffer: () => Promise<RTCSessionDescriptionInit>;
  createAnswer: (
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit>;
  setRemoteAns: (ans: RTCSessionDescriptionInit) => Promise<void>;
  sendStream: (stream: MediaStream) => void;
  incomingRemoteStream: MediaStream | null;
  connectionState: string | null;
  getSenderVideoTrack: () => RTCRtpSender | null;
}
const PeerContext = React.createContext<PeerContextType>({
  peer: null,
  createOffer: async () => ({
    type: "offer",
    sdp: "",
  }),
  createAnswer: async () => ({
    type: "answer",
    sdp: "",
  }),
  setRemoteAns: async () => {},
  sendStream: () => {},
  incomingRemoteStream: null,
  connectionState: null,
  getSenderVideoTrack: () => null,
});

export const usePeer = () => {
  return React.useContext(PeerContext);
};

interface PeerProviderProps {
  children: React.ReactNode;
}

export const PeerProvider = (props: PeerProviderProps) => {
  console.log("🔄 PeerProvider rendering");

  const [incomingRemoteStream, setIncomingRemoteStream] =
    React.useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    React.useState<RTCPeerConnectionState>("new");
  const socket = useSocket();
  const { localStream } = useMedia();

  const peer = useMemo(() => {
    if (typeof window === "undefined") {
      console.log("This is still SSR");
      return null;
    }
    console.log("Hydrated");

    const p = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
        {
          urls: "turn:turn.p2pshare.tech:3478",
          username: "admin",
          credential: "admin1",
        },
      ],
    });

    // Add connection state logging
    p.oniceconnectionstatechange = () => {
      console.log("🧊 ICE Connection State:", p.iceConnectionState);
    };

    p.onconnectionstatechange = () => {
      console.log("🔌 Connection State:", p.connectionState);
      setConnectionState(p.connectionState);
    };

    p.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          "🧊 New ICE candidate:",
          event.candidate.type,
          event.candidate.protocol,
          event.candidate.address
        );
      } else {
        console.log("🧊 ICE candidate gathering complete");
      }
    };

    return p;
  }, []);

  //   console.log(peer);

  const getSenderVideoTrack = useCallback(() => {
    if (!peer) return null;

    const senders = peer.getSenders();
    const videoSender = senders.find(
      (sender) => sender.track && sender.track.kind === "video"
    );

    return videoSender || null;
  }, [peer]);

  const createOffer = useCallback(async () => {
    if (!peer) throw new Error("Peer connection not established");

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(new RTCSessionDescription(offer));
      return {
        sdp: offer.sdp,
        type: offer.type as RTCSdpType,
      };
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }, [peer]);

  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peer) throw new Error("Peer connection not established");

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        return answer;
      } catch (error) {
        console.error("Error creating answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const setRemoteAns = useCallback(
    async (ans: RTCSessionDescriptionInit) => {
      try {
        if (!peer) throw new Error("No peer connection");

        if (peer.signalingState === "stable") {
          console.log("🚫 Already in stable state, cannot set remote answer");
          return;
        }

        await peer.setRemoteDescription(new RTCSessionDescription(ans));
        console.log("✅ Remote answer set successfully");
      } catch (error) {
        console.error("❌ Error setting remote answer:", error);
        throw error;
      }
    },
    [peer]
  );

  const sendStream = useCallback(
    (stream: MediaStream) => {
      stream.getTracks().forEach((track) => {
        // Adding a local stream and sending it to the Other client
        peer?.addTrack(track, stream);
      });
    },
    [peer]
  );

  const handleRemoteStreamIncomingEvent = useCallback(
    (event: RTCTrackEvent) => {
      const incomingRemoteStream = event.streams[0];
      setIncomingRemoteStream(incomingRemoteStream);
    },
    []
  );

  const handleAddTrackForCallee = useCallback(
    ({ roomID }: { roomID: string }) => {
      console.log("Add track for callee is triggered in room:", roomID);
      if (localStream) {
        console.log("Local stream is available");
        localStream.getTracks().forEach((track) => {
          // Adding a local stream and sending it to the Other client
          peer?.addTrack(track, localStream);
        });
      } else {
        console.log("Local stream is not available");
      }
    },
    [localStream, peer]
  );

  React.useEffect(() => {
    socket?.on("add-track-for-callee", handleAddTrackForCallee);
    peer?.addEventListener("track", handleRemoteStreamIncomingEvent);

    return () => {
      socket?.off("add-track-for-callee", handleAddTrackForCallee);
      peer?.removeEventListener("track", handleRemoteStreamIncomingEvent);
    };
  }, [handleAddTrackForCallee, handleRemoteStreamIncomingEvent, peer, socket]);

  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`🔄 PeerProvider render #${renderCount.current}`);
  }, []);

  useEffect(() => {
    console.log("🔄 PeerProvider mounted");

    return () => {
      console.log("🔄 PeerProvider unmounted");
    };
  }, []);

  useEffect(() => {
    console.log(
      "🔄 PeerProvider incomingRemoteStream changed:",
      incomingRemoteStream
    );
  }, [incomingRemoteStream]);

  useEffect(() => {
    console.log("🔄 PeerProvider connectionState changed:", connectionState);
  }, [connectionState]);

  const contextValue = useMemo(
    () => ({
      peer,
      createOffer,
      createAnswer,
      setRemoteAns,
      sendStream,
      incomingRemoteStream,
      connectionState,
      getSenderVideoTrack,
    }),
    [
      peer,
      createOffer,
      createAnswer,
      setRemoteAns,
      sendStream,
      incomingRemoteStream,
      connectionState,
      getSenderVideoTrack,
    ]
  );

  return (
    <PeerContext.Provider value={contextValue}>
      {props.children}
    </PeerContext.Provider>
  );
};
