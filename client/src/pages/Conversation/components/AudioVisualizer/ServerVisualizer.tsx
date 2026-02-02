import { FC, RefObject, useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "../../hooks/audioUtils";
import { useSocketContext } from "../../SocketContext";
import { type ThemeType } from "../../hooks/useSystemTheme";

type AudioVisualizerProps = {
  analyser: AnalyserNode | null;
  parent: RefObject<HTMLElement>;
  theme: ThemeType;
};

const MAX_INTENSITY = 255;

// Purple/Fuchsia theme for IELTS
const COLORS = {
  outer: "#7c3aed", // Purple-600
  inner: "#d946ef", // Fuchsia-500
  connected: "#22c55e", // Green for connected state
  stroke: "rgba(168, 85, 247, 0.5)", // Purple with opacity
  background: "transparent",
};

export const ServerVisualizer: FC<AudioVisualizerProps> = ({ analyser, parent, theme }) => {
  const [canvasWidth, setCanvasWidth] = useState(parent.current ? Math.min(parent.current.clientWidth, parent.current.clientHeight) : 0);
  const requestRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { socketStatus } = useSocketContext();

  const draw = useCallback((width: number, centerX: number, centerY: number, audioData: Uint8Array, ctx: CanvasRenderingContext2D) => {
    const maxCircleWidth = Math.floor(width * 0.95);
    const averageIntensity = Math.sqrt(
      audioData.reduce((acc, curr) => acc + curr * curr, 0) / audioData.length,
    );
    const intensity = clamp(
      averageIntensity * 1.4,
      averageIntensity,
      MAX_INTENSITY,
    );
    const relIntensity = intensity / MAX_INTENSITY;
    const radius = ((socketStatus === "connected" ? 0.3 + 0.7 * relIntensity : relIntensity) * maxCircleWidth) / 2;

    // Clear with transparent background
    ctx.clearRect(centerX - width / 2, centerY - width / 2, width, width);

    // Draw gradient outer glow
    if (socketStatus === "connected") {
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, "rgba(168, 85, 247, 0.3)");
      gradient.addColorStop(0.5, "rgba(217, 70, 239, 0.15)");
      gradient.addColorStop(1, "rgba(217, 70, 239, 0)");
      ctx.beginPath();
      ctx.fillStyle = gradient;
      ctx.arc(centerX, centerY, radius * 1.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    }

    // Main circle with gradient
    ctx.beginPath();
    const mainGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    mainGradient.addColorStop(0, COLORS.inner);
    mainGradient.addColorStop(1, COLORS.outer);
    ctx.fillStyle = mainGradient;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    // Draw inner core if connected
    if (socketStatus === "connected") {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxCircleWidth / 8, 0, 2 * Math.PI);
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxCircleWidth / 8);
      coreGradient.addColorStop(0, "#ffffff");
      coreGradient.addColorStop(0.5, COLORS.inner);
      coreGradient.addColorStop(1, COLORS.outer);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      ctx.closePath();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxCircleWidth / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = COLORS.stroke;
    ctx.lineWidth = width / 80;
    ctx.stroke();
    ctx.closePath();
  }, [socketStatus]);

  const visualizeData = useCallback(() => {
    const width = parent.current ? Math.min(parent.current.clientWidth, parent.current.clientHeight) : 0;
    if (width !== canvasWidth) {
      setCanvasWidth(width);
    }
    requestRef.current = window.requestAnimationFrame(() => visualizeData());
    if (!canvasRef.current) {
      return;
    }
    const ctx = canvasRef.current.getContext("2d");
    const audioData = new Uint8Array(140);
    analyser?.getByteFrequencyData(audioData);
    if (!ctx) {
      return;
    }
    const centerX = width / 2;
    const centerY = width / 2;
    draw(width, centerX, centerY, audioData, ctx);
  }, [analyser, socketStatus, canvasWidth, parent, draw]);


  useEffect(() => {
    if (!analyser) {
      return;
    }
    analyser.smoothingTimeConstant = 0.95;
    visualizeData();
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [visualizeData, analyser]);

  return (
    <canvas
      className="max-h-full max-w-full"
      ref={canvasRef}
      width={canvasWidth}
      height={canvasWidth}
    />
  );
};
