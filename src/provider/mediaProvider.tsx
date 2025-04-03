import { createContext, useContext, useState, useCallback } from "react";
import React from "react";

interface MediaProviderContext {
  localStream: MediaStream | null;
  getUserMedia: () => Promise<void>;
  getScreenTrack: () => Promise<MediaStreamTrack | null>;
  replaceTrack: (
    videoSender: RTCRtpSender,
    screenTrack: MediaStreamTrack
  ) => Promise<void>;
  combineScreenAndCameraTrack: (
    screenTrack: MediaStreamTrack
  ) => Promise<MediaStream>;
}

const MediaContext = createContext<MediaProviderContext>({
  localStream: null,
  getUserMedia: async () => {},
  getScreenTrack: async () => null,
  replaceTrack: async () => {},
  combineScreenAndCameraTrack: async () => new MediaStream(),
});

export const useMedia = () => {
  return useContext(MediaContext);
};

interface MediaProviderProps {
  children: React.ReactNode;
}

const MediaProvider = (props: MediaProviderProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const getUserMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (stream) {
        setLocalStream(stream);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("No media device found");
    }
  }, []);

  const getScreenTrack = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      return screenTrack;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.log("No Screen Share Found");
      return null;
    }
  };

  const replaceTrack = async (
    videoSender: RTCRtpSender,
    screenTrack: MediaStreamTrack
  ) => {
    await videoSender.replaceTrack(screenTrack);
  };

  const combineScreenAndCameraTrack = async (screenTrack: MediaStreamTrack) => {
    const combinedStream = new MediaStream();
    combinedStream.addTrack(screenTrack);

    if (localStream) {
      localStream
        .getAudioTracks()
        .forEach((track) => combinedStream.addTrack(track));
    }

    return combinedStream;
  };

  return (
    <MediaContext.Provider
      value={{
        getUserMedia,
        localStream,
        getScreenTrack,
        replaceTrack,
        combineScreenAndCameraTrack,
      }}
    >
      {props.children}
    </MediaContext.Provider>
  );
};

export default MediaProvider;
