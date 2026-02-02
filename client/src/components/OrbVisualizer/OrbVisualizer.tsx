import { FC, useEffect, useRef } from 'react';

interface OrbVisualizerProps {
    analyser: AnalyserNode | null;
}

export const OrbVisualizer: FC<OrbVisualizerProps> = ({ analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = 'screen';

        let animationId = 0;
        let time = 0;

        const render = () => {
            time += 0.015;

            // Get volume from analyser
            let energy = 0.2; // base energy when idle
            if (analyser) {
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                energy = Math.max(0.2, (average / 255) * 1.5);
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const baseRadius = Math.min(cx, cy) * 0.35;

            // Blob 1: Cyan/Blue
            drawBlob(ctx, cx, cy, time, 0, energy, baseRadius,
                'rgba(0, 200, 255, 0.6)',
                'rgba(0, 100, 255, 0)'
            );

            // Blob 2: Purple/Pink
            drawBlob(ctx, cx, cy, time, (Math.PI * 2) / 3, energy, baseRadius,
                'rgba(200, 50, 255, 0.6)',
                'rgba(150, 0, 200, 0)'
            );

            // Blob 3: White/Mint core
            drawBlob(ctx, cx, cy, time, ((Math.PI * 2) / 3) * 2, energy, baseRadius,
                'rgba(100, 255, 200, 0.5)',
                'rgba(255, 255, 255, 0)'
            );

            // Central Core glow
            const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * (0.8 + energy * 0.5));
            coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            coreGradient.addColorStop(0.4, 'rgba(200, 200, 255, 0.2)');
            coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(cx, cy, baseRadius * 2, 0, Math.PI * 2);
            ctx.fill();

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [analyser]);

    return (
        <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-64 h-64 sm:w-80 sm:h-80"
            style={{ filter: 'blur(8px)' }}
        />
    );
};

function drawBlob(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    time: number,
    phase: number,
    energy: number,
    baseRadius: number,
    colorInner: string,
    colorOuter: string
) {
    const wobbleX = Math.sin(time * 2 + phase) * baseRadius * 0.5;
    const wobbleY = Math.cos(time * 1.5 + phase) * baseRadius * 0.5;
    const r = baseRadius * (1 + energy);

    const grad = ctx.createRadialGradient(cx + wobbleX, cy + wobbleY, 0, cx + wobbleX, cy + wobbleY, r * 1.5);
    grad.addColorStop(0, colorInner);
    grad.addColorStop(1, colorOuter);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx + wobbleX, cy + wobbleY, r * 2, 0, Math.PI * 2);
    ctx.fill();
}
