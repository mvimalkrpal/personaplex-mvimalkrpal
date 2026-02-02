import { FC, useCallback, useEffect } from "react";
import { useSocketContext } from "../../SocketContext";
import { useUserAudio } from "../../hooks/useUserAudio";
import { type ThemeType } from "../../hooks/useSystemTheme";

type UserAudioProps = {
  theme: ThemeType;
};

export const UserAudio: FC<UserAudioProps> = ({ theme: _theme }) => {
  const { sendMessage, socketStatus } = useSocketContext();

  const onRecordingStart = useCallback(() => {
    console.log("Recording started");
  }, []);

  const onRecordingStop = useCallback(() => {
    console.log("Recording stopped");
  }, []);

  const onRecordingChunk = useCallback(
    (chunk: Uint8Array) => {
      if (socketStatus !== "connected") {
        return;
      }
      sendMessage({
        type: "audio",
        data: chunk,
      });
    },
    [sendMessage, socketStatus],
  );

  const { startRecordingUser, stopRecording } = useUserAudio({
    constraints: {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
      video: false,
    },
    onDataChunk: onRecordingChunk,
    onRecordingStart,
    onRecordingStop,
  });

  useEffect(() => {
    let res: Awaited<ReturnType<typeof startRecordingUser>>;
    if (socketStatus === "connected") {
      startRecordingUser().then(result => {
        if (result) {
          res = result;
        }
      });
    }
    return () => {
      console.log("Stop recording called");
      stopRecording();
      res?.source?.disconnect();
    };
  }, [startRecordingUser, stopRecording, socketStatus]);

  // No visual component - the orb in ServerAudio handles visualization
  return null;
};
