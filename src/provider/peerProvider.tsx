"use client";

import React from "react";
import { useMemo } from "react";

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
  const [incomingRemoteStream, setIncomingRemoteStream] =
    React.useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] =
    React.useState<RTCPeerConnectionState>("new");

  const peer = useMemo(() => {
    if (typeof window === "undefined") {
      console.log("This is still SSR");
      return null;
    } else {
      console.log("Hydrated");
    }

    const p = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
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

    return p;
  }, []);

  //   console.log(peer);

  const getSenderVideoTrack = () => {
    if (!peer) return null;

    const senders = peer.getSenders();
    const videoSender = senders.find(
      (sender) => sender.track && sender.track.kind === "video"
    );

    return videoSender || null;
  };

  const createOffer = async () => {
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
  };

  const createAnswer = async (offer: RTCSessionDescriptionInit) => {
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
  };

  const setRemoteAns = async (ans: RTCSessionDescriptionInit) => {
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
  };

  const sendStream = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      // Adding a local stream and sending it to the Other client
      peer?.addTrack(track, stream);
    });
  };

  const handleRemoteStreamIncomingEvent = (event: RTCTrackEvent) => {
    const incomingRemoteStream = event.streams[0];
    setIncomingRemoteStream(incomingRemoteStream);
  };

  React.useEffect(() => {
    peer?.addEventListener("track", handleRemoteStreamIncomingEvent);

    return () => {
      peer?.removeEventListener("track", handleRemoteStreamIncomingEvent);
    };
  }, [peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
        incomingRemoteStream,
        connectionState,
        getSenderVideoTrack,
      }}
    >
      {props.children}
    </PeerContext.Provider>
  );
};
