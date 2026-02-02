import moshiProcessorUrl from "../../audio-processor.ts?worker&url";
import { FC, useEffect, useState, useCallback, useRef, MutableRefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { Conversation } from "../Conversation/Conversation";
import { useModelParams } from "../Conversation/hooks/useModelParams";
import { env } from "../../env";
import { prewarmDecoderWorker } from "../../decoder/decoderWorker";

// IELTS Examiner persona - default prompt
const IELTS_EXAMINER_PROMPT = `You are an experienced IELTS speaking examiner conducting an official speaking test. Your role is to:
- Ask clear, well-paced questions appropriate for IELTS speaking test
- Give candidates time to respond fully
- Ask natural follow-up questions based on their answers
- Cover all three parts of the speaking test progressively
- Be professional, encouraging, and maintain a natural conversation flow

Start by greeting the candidate warmly and asking for their full name. Then proceed with Part 1 questions about familiar topics.`;

// Natural female voice for examiner
const DEFAULT_VOICE = "NATF0.pt";

interface HomepageProps {
  showMicrophoneAccessMessage: boolean;
  startConnection: () => Promise<void>;
}

const Homepage = ({
  startConnection,
  showMicrophoneAccessMessage,
}: HomepageProps) => {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 relative">
      {/* Ambient glow background */}
      <div className="ambient-glow" />

      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-fuchsia-900/20 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg text-center">

        {/* Brand */}
        <div className="mb-4">
          <h1 className="text-5xl font-bold gradient-text mb-3">
            IELTS Speaking Practice
          </h1>
          <p className="text-gray-400 text-sm">
            Powered by Anglotec × PersonaPlex
          </p>
        </div>

        {/* Description */}
        <div className="glass p-6">
          <p className="text-gray-300 leading-relaxed">
            Practice your IELTS speaking skills with an AI examiner.
            Experience a realistic speaking test environment with natural
            conversation flow and instant feedback.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="glass p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-sm text-gray-300">Real Test Format</div>
          </div>
          <div className="glass p-4 text-center">
            <div className="text-2xl mb-2">🎙️</div>
            <div className="text-sm text-gray-300">Natural Voice</div>
          </div>
          <div className="glass p-4 text-center">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-sm text-gray-300">Full Duplex</div>
          </div>
        </div>

        {/* Microphone warning */}
        {showMicrophoneAccessMessage && (
          <div className="glass p-4 border-red-500/50 bg-red-500/10">
            <p className="text-red-400 text-sm">
              ⚠️ Please enable microphone access to continue
            </p>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={async () => await startConnection()}
          className="btn-primary text-lg px-10 py-4"
        >
          Start IELTS Session
        </button>

        {/* Footer note */}
        <p className="text-gray-500 text-xs mt-4">
          Ensure you're in a quiet environment with a working microphone
        </p>
      </div>
    </div>
  );
};

export const Queue: FC = () => {
  const theme = "dark" as const;
  const [searchParams] = useSearchParams();
  const overrideWorkerAddr = searchParams.get("worker_addr");
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false);
  const [showMicrophoneAccessMessage, setShowMicrophoneAccessMessage] = useState<boolean>(false);
  const modelParams = useModelParams({
    textPrompt: IELTS_EXAMINER_PROMPT,
    voicePrompt: DEFAULT_VOICE,
  });

  const audioContext = useRef<AudioContext | null>(null);
  const worklet = useRef<AudioWorkletNode | null>(null);

  // Set IELTS defaults on mount
  useEffect(() => {
    modelParams.setTextPrompt(IELTS_EXAMINER_PROMPT);
    modelParams.setVoicePrompt(DEFAULT_VOICE);
  }, []);

  const getMicrophoneAccess = useCallback(async () => {
    try {
      await window.navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicrophoneAccess(true);
      return true;
    } catch (e) {
      console.error(e);
      setShowMicrophoneAccessMessage(true);
      setHasMicrophoneAccess(false);
    }
    return false;
  }, [setHasMicrophoneAccess, setShowMicrophoneAccessMessage]);

  const startProcessor = useCallback(async () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
      prewarmDecoderWorker(audioContext.current.sampleRate);
    }
    if (worklet.current) {
      return;
    }
    let ctx = audioContext.current;
    ctx.resume();
    try {
      worklet.current = new AudioWorkletNode(ctx, 'moshi-processor');
    } catch (err) {
      await ctx.audioWorklet.addModule(moshiProcessorUrl);
      worklet.current = new AudioWorkletNode(ctx, 'moshi-processor');
    }
    worklet.current.connect(ctx.destination);
  }, [audioContext, worklet]);

  const startConnection = useCallback(async () => {
    await startProcessor();
    await getMicrophoneAccess();
  }, [startProcessor, getMicrophoneAccess]);

  return (
    <>
      {(hasMicrophoneAccess && audioContext.current && worklet.current) ? (
        <Conversation
          workerAddr={overrideWorkerAddr ?? ""}
          audioContext={audioContext as MutableRefObject<AudioContext | null>}
          worklet={worklet as MutableRefObject<AudioWorkletNode | null>}
          theme={theme}
          startConnection={startConnection}
          {...modelParams}
        />
      ) : (
        <Homepage
          startConnection={startConnection}
          showMicrophoneAccessMessage={showMicrophoneAccessMessage}
        />
      )}
    </>
  );
};
