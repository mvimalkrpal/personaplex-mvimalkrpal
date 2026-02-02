import moshiProcessorUrl from "../../audio-processor.ts?worker&url";
import { FC, useState, useCallback, useRef, MutableRefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { Conversation } from "../Conversation/Conversation";
import { useModelParams } from "../Conversation/hooks/useModelParams";
import { prewarmDecoderWorker } from "../../decoder/decoderWorker";

// IELTS Examiner persona - default prompt
const DEFAULT_PROMPT = `You are an experienced IELTS speaking examiner conducting an official speaking test. Your role is to:
- Greet the candidate introduce yourself as Sarah and ask their name in warm friendly tone
- Tell the candidate that this will be a mock IELTS interview
- Ask clear, well-paced questions appropriate for IELTS speaking test
- Give candidates time to respond fully
- Ask natural follow-up questions based on their answers
- Cover all three parts of the speaking test progressively
- Be professional, encouraging, and maintain a natural conversation flow`

// Voice options
const VOICE_OPTIONS = [
  { id: "NATF0.pt", label: "Natural Female 1", category: "Natural" },
  { id: "NATF1.pt", label: "Natural Female 2", category: "Natural" },
  { id: "NATF2.pt", label: "Natural Female 3", category: "Natural" },
  { id: "NATF3.pt", label: "Natural Female 4", category: "Natural" },
  { id: "NATM0.pt", label: "Natural Male 1", category: "Natural" },
  { id: "NATM1.pt", label: "Natural Male 2", category: "Natural" },
  { id: "NATM2.pt", label: "Natural Male 3", category: "Natural" },
  { id: "NATM3.pt", label: "Natural Male 4", category: "Natural" },
  { id: "VARF0.pt", label: "Variety Female 1", category: "Variety" },
  { id: "VARF1.pt", label: "Variety Female 2", category: "Variety" },
  { id: "VARF2.pt", label: "Variety Female 3", category: "Variety" },
  { id: "VARF3.pt", label: "Variety Female 4", category: "Variety" },
  { id: "VARF4.pt", label: "Variety Female 5", category: "Variety" },
  { id: "VARM0.pt", label: "Variety Male 1", category: "Variety" },
  { id: "VARM1.pt", label: "Variety Male 2", category: "Variety" },
  { id: "VARM2.pt", label: "Variety Male 3", category: "Variety" },
  { id: "VARM3.pt", label: "Variety Male 4", category: "Variety" },
  { id: "VARM4.pt", label: "Variety Male 5", category: "Variety" },
];

const DEFAULT_VOICE = "NATF0.pt";

interface HomepageProps {
  showMicrophoneAccessMessage: boolean;
  startConnection: () => Promise<void>;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

const Homepage = ({
  startConnection,
  showMicrophoneAccessMessage,
  selectedVoice,
  setSelectedVoice,
}: HomepageProps) => {
  const [showVoicePanel, setShowVoicePanel] = useState(false);

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 relative">
      {/* Ambient glow background */}
      <div className="ambient-glow" />
      <div className="fixed inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-fuchsia-900/20 pointer-events-none" />

      {/* Voice Selection Button (top right) */}
      <button
        onClick={() => setShowVoicePanel(!showVoicePanel)}
        className="fixed top-6 right-6 z-20 glass px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
      >
        🎙️ Voice
      </button>

      {/* Voice Selection Panel */}
      {showVoicePanel && (
        <div className="fixed top-16 right-6 z-30 glass p-4 w-64 max-h-96 overflow-y-auto scrollbar">
          <h3 className="text-sm font-semibold text-white mb-3">Select Voice</h3>

          {/* Natural voices */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Natural</p>
            <div className="space-y-1">
              {VOICE_OPTIONS.filter(v => v.category === "Natural").map(voice => (
                <button
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    setShowVoicePanel(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedVoice === voice.id
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'hover:bg-white/10 text-gray-300'
                    }`}
                >
                  {voice.label}
                </button>
              ))}
            </div>
          </div>

          {/* Variety voices */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Variety</p>
            <div className="space-y-1">
              {VOICE_OPTIONS.filter(v => v.category === "Variety").map(voice => (
                <button
                  key={voice.id}
                  onClick={() => {
                    setSelectedVoice(voice.id);
                    setShowVoicePanel(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedVoice === voice.id
                    ? 'bg-purple-500/30 text-purple-300'
                    : 'hover:bg-white/10 text-gray-300'
                    }`}
                >
                  {voice.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showVoicePanel && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowVoicePanel(false)}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 text-center">

        {/* Brand */}
        <div>
          <h1 className="text-5xl font-bold gradient-text mb-3">
            Anglotec AI Demo
          </h1>
          <p className="text-gray-400 text-sm">
            Powered by heyluna.in
          </p>
        </div>

        {/* Microphone warning */}
        {showMicrophoneAccessMessage && (
          <div className="glass p-4 border-red-500/50 bg-red-500/10">
            <p className="text-red-400 text-sm">
              ⚠️ Please enable microphone access
            </p>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={async () => await startConnection()}
          className="btn-primary text-lg px-12 py-5"
        >
          Start New Session
        </button>

        {/* Selected voice indicator */}
        <p className="text-gray-500 text-xs">
          Voice: {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label || selectedVoice}
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
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);

  const modelParams = useModelParams({
    textPrompt: DEFAULT_PROMPT,
    voicePrompt: selectedVoice,
  });

  // Update voice when selection changes
  const handleVoiceChange = useCallback((voice: string) => {
    setSelectedVoice(voice);
    modelParams.setVoicePrompt(voice);
  }, [modelParams]);

  const audioContext = useRef<AudioContext | null>(null);
  const worklet = useRef<AudioWorkletNode | null>(null);

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
    const ctx = audioContext.current;
    ctx.resume();
    try {
      worklet.current = new AudioWorkletNode(ctx, 'moshi-processor');
    } catch (_err) {
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
          selectedVoice={selectedVoice}
          setSelectedVoice={handleVoiceChange}
        />
      )}
    </>
  );
};
