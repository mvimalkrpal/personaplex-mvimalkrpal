import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSocket } from "./hooks/useSocket";
import { SocketContext } from "./SocketContext";
import { ServerAudio } from "./components/ServerAudio/ServerAudio";
import { UserAudio } from "./components/UserAudio/UserAudio";
import { AudioStats } from "./hooks/useServerAudio";
import { MediaContext } from "./MediaContext";
import { ModelParamsValues, useModelParams } from "./hooks/useModelParams";
import fixWebmDuration from "webm-duration-fix";
import { getMimeType, getExtension } from "./getMimeType";
import { type ThemeType } from "./hooks/useSystemTheme";

type ConversationProps = {
  workerAddr: string;
  workerAuthId?: string;
  sessionAuthId?: string;
  sessionId?: number;
  email?: string;
  theme: ThemeType;
  audioContext: MutableRefObject<AudioContext | null>;
  worklet: MutableRefObject<AudioWorkletNode | null>;
  onConversationEnd?: () => void;
  isBypass?: boolean;
  startConnection: () => Promise<void>;
} & Partial<ModelParamsValues>;


const buildURL = ({
  workerAddr,
  params,
  workerAuthId,
  email,
  textSeed,
  audioSeed,
}: {
  workerAddr: string;
  params: ModelParamsValues;
  workerAuthId?: string;
  email?: string;
  textSeed: number;
  audioSeed: number;
}) => {
  const newWorkerAddr = useMemo(() => {
    if (workerAddr == "same" || workerAddr == "") {
      const newWorkerAddr = window.location.hostname + ":" + window.location.port;
      console.log("Overriding workerAddr to", newWorkerAddr);
      return newWorkerAddr;
    }
    return workerAddr;
  }, [workerAddr]);
  const wsProtocol = (window.location.protocol === 'https:') ? 'wss' : 'ws';
  const url = new URL(`${wsProtocol}://${newWorkerAddr}/api/chat`);
  if (workerAuthId) {
    url.searchParams.append("worker_auth_id", workerAuthId);
  }
  if (email) {
    url.searchParams.append("email", email);
  }
  url.searchParams.append("text_temperature", params.textTemperature.toString());
  url.searchParams.append("text_topk", params.textTopk.toString());
  url.searchParams.append("audio_temperature", params.audioTemperature.toString());
  url.searchParams.append("audio_topk", params.audioTopk.toString());
  url.searchParams.append("pad_mult", params.padMult.toString());
  url.searchParams.append("text_seed", textSeed.toString());
  url.searchParams.append("audio_seed", audioSeed.toString());
  url.searchParams.append("repetition_penalty_context", params.repetitionPenaltyContext.toString());
  url.searchParams.append("repetition_penalty", params.repetitionPenalty.toString());
  url.searchParams.append("text_prompt", params.textPrompt.toString());
  url.searchParams.append("voice_prompt", params.voicePrompt.toString());
  console.log(url.toString());
  return url.toString();
};


export const Conversation: FC<ConversationProps> = ({
  workerAddr,
  workerAuthId,
  audioContext,
  worklet,
  sessionAuthId,
  sessionId,
  onConversationEnd,
  startConnection,
  isBypass = false,
  email,
  theme,
  ...params
}) => {
  const getAudioStats = useRef<() => AudioStats>(() => ({
    playedAudioDuration: 0,
    missedAudioDuration: 0,
    totalAudioMessages: 0,
    delay: 0,
    minPlaybackDelay: 0,
    maxPlaybackDelay: 0,
  }));
  const isRecording = useRef<boolean>(false);
  const audioChunks = useRef<Blob[]>([]);

  const audioStreamDestination = useRef<MediaStreamAudioDestinationNode>(audioContext.current!.createMediaStreamDestination());
  const stereoMerger = useRef<ChannelMergerNode>(audioContext.current!.createChannelMerger(2));
  const audioRecorder = useRef<MediaRecorder>(new MediaRecorder(audioStreamDestination.current.stream, { mimeType: getMimeType("audio"), audioBitsPerSecond: 128000 }));
  const [audioURL, setAudioURL] = useState<string>("");
  const [isOver, setIsOver] = useState(false);
  const modelParams = useModelParams(params);
  const micDuration = useRef<number>(0);
  const actualAudioPlayed = useRef<number>(0);
  const textSeed = useMemo(() => Math.round(1000000 * Math.random()), []);
  const audioSeed = useMemo(() => Math.round(1000000 * Math.random()), []);

  const WSURL = buildURL({
    workerAddr,
    params: modelParams,
    workerAuthId,
    email: email,
    textSeed: textSeed,
    audioSeed: audioSeed,
  });

  const onDisconnect = useCallback(() => {
    setIsOver(true);
    console.log("on disconnect!");
    stopRecording();
  }, [setIsOver]);

  const { socketStatus, sendMessage, socket, start, stop } = useSocket({
    uri: WSURL,
    onDisconnect,
  });

  useEffect(() => {
    audioRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };
    audioRecorder.current.onstop = async () => {
      let blob: Blob;
      const mimeType = getMimeType("audio");
      if (mimeType.includes("webm")) {
        blob = await fixWebmDuration(new Blob(audioChunks.current, { type: mimeType }));
      } else {
        blob = new Blob(audioChunks.current, { type: mimeType });
      }
      setAudioURL(URL.createObjectURL(blob));
      audioChunks.current = [];
      console.log("Audio Recording and encoding finished");
    };
  }, [audioRecorder, setAudioURL, audioChunks]);


  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, workerAuthId]);

  const startRecording = useCallback(() => {
    if (isRecording.current) {
      return;
    }
    console.log("Starting recording");
    try {
      stereoMerger.current.disconnect();
    } catch { }
    try {
      worklet.current?.disconnect(audioStreamDestination.current);
    } catch { }
    worklet.current?.connect(stereoMerger.current, 0, 0);
    stereoMerger.current.connect(audioStreamDestination.current);

    setAudioURL("");
    audioRecorder.current.start();
    isRecording.current = true;
  }, [isRecording, worklet, audioStreamDestination, audioRecorder, stereoMerger]);

  const stopRecording = useCallback(() => {
    console.log("Stopping recording");
    if (!isRecording.current) {
      return;
    }
    try {
      worklet.current?.disconnect(stereoMerger.current);
    } catch { }
    try {
      stereoMerger.current.disconnect(audioStreamDestination.current);
    } catch { }
    audioRecorder.current.stop();
    isRecording.current = false;
  }, [isRecording, worklet, audioStreamDestination, audioRecorder, stereoMerger]);

  const onPressAction = useCallback(async () => {
    if (isOver) {
      window.location.reload();
    } else {
      audioContext.current?.resume();
      if (socketStatus !== "connected") {
        start();
      } else {
        stop();
      }
    }
  }, [socketStatus, isOver, start, stop]);

  // Status display
  const statusDisplay = useMemo(() => {
    if (isOver) {
      return { text: "Session Ended", color: "text-gray-400", dotColor: "bg-gray-400" };
    }
    if (socketStatus === "connected") {
      return { text: "Examiner Ready – Start Speaking", color: "text-green-400", dotColor: "bg-green-500" };
    }
    if (socketStatus === "connecting") {
      return { text: "Connecting to AI Examiner...", color: "text-yellow-400", dotColor: "bg-yellow-500" };
    }
    return { text: "Disconnected", color: "text-red-400", dotColor: "bg-red-500" };
  }, [socketStatus, isOver]);

  const buttonText = useMemo(() => {
    if (isOver) return "Start New Session";
    if (socketStatus === "connected") return "End Session";
    return "Connecting...";
  }, [isOver, socketStatus]);

  return (
    <SocketContext.Provider value={{ socketStatus, sendMessage, socket }}>
      <div className="min-h-screen w-screen flex flex-col items-center justify-between p-6 relative overflow-hidden">
        {/* Ambient glow background */}
        <div className="ambient-glow" />
        <div className="fixed inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-fuchsia-900/20 pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 text-center pt-4">
          <h1 className="text-3xl font-bold gradient-text">
            IELTS Speaking Practice
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Powered by Anglotec × PersonaPlex
          </p>
        </div>

        {/* Main visualizer area */}
        {audioContext.current && worklet.current && (
          <MediaContext.Provider value={{
            startRecording,
            stopRecording,
            audioContext: audioContext as MutableRefObject<AudioContext>,
            worklet: worklet as MutableRefObject<AudioWorkletNode>,
            audioStreamDestination,
            stereoMerger,
            micDuration,
            actualAudioPlayed,
          }}>
            <div className="relative z-10 flex flex-col items-center justify-center flex-grow gap-8 w-full max-w-lg">
              {/* Server (Examiner) Audio Visualizer */}
              <div className="w-full flex justify-center">
                <ServerAudio
                  setGetAudioStats={(callback: () => AudioStats) => (getAudioStats.current = callback)}
                  theme={theme}
                />
              </div>

              {/* User Audio Visualizer */}
              <div className="w-full flex justify-center">
                <UserAudio theme={theme} />
              </div>
            </div>
          </MediaContext.Provider>
        )}

        {/* Controls */}
        <div className="relative z-10 flex flex-col items-center gap-4 pb-6">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusDisplay.dotColor} ${socketStatus === "connecting" ? "animate-pulse" : ""}`} />
            <span className={`text-sm font-mono ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={onPressAction}
            disabled={socketStatus === "connecting"}
            className={isOver ? "btn-primary" : "btn-secondary"}
          >
            {buttonText}
          </button>

          {/* Download link */}
          {audioURL && (
            <a
              href={audioURL}
              download={`ielts_practice.${getExtension("audio")}`}
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              Download Recording
            </a>
          )}
        </div>
      </div>
    </SocketContext.Provider>
  );
};
