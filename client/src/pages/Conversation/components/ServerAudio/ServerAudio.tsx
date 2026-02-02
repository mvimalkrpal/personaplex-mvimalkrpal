import { FC } from "react";
import { AudioStats, useServerAudio } from "../../hooks/useServerAudio";
import { OrbVisualizer } from "../../../../components/OrbVisualizer/OrbVisualizer";
import { type ThemeType } from "../../hooks/useSystemTheme";

type ServerAudioProps = {
  setGetAudioStats: (getAudioStats: () => AudioStats) => void;
  theme: ThemeType;
};

export const ServerAudio: FC<ServerAudioProps> = ({ setGetAudioStats, theme: _theme }) => {
  const { analyser, hasCriticalDelay, setHasCriticalDelay } = useServerAudio({
    setGetAudioStats,
  });

  return (
    <>
      {hasCriticalDelay && (
        <div className="fixed left-0 top-0 flex w-screen justify-between bg-red-500/90 p-2 text-center z-50">
          <p className="text-white">A connection issue has been detected</p>
          <button
            onClick={async () => {
              setHasCriticalDelay(false);
            }}
            className="bg-white px-3 py-1 text-black rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex items-center justify-center">
        <OrbVisualizer analyser={analyser.current} />
      </div>
    </>
  );
};
