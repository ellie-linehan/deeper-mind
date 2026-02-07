"use client";

import { useEffect, useRef } from "react";
import { brainbitManager } from "@/lib/brainbit";

export function SignalGraph() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dataRef = useRef<number[]>(new Array(500).fill(0)); // Buffer for 500 samples ~2s at 250Hz

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Subscribe to raw data
        brainbitManager.subscribeRaw((sample) => {
            // Simple high-pass filter to remove DC offset for visualization
            // or just center it.
            // Let's just push raw scaled values.
            dataRef.current.push(sample);
            if (dataRef.current.length > canvas.width) {
                dataRef.current.shift();
            }
        });

        let animationFrameId: number;

        const draw = () => {
            if (!canvas || !ctx) return;

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Style
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#a855f7'; // Purple-500
            ctx.beginPath();

            const data = dataRef.current;
            const height = canvas.height;
            const width = canvas.width;

            // Auto-scale or fixed scale?
            // Microvolts are typically +/- 50 to 100uV
            // But with DC offset it might be drifting.
            // Let's apply a local mean subtraction for the view
            const sum = data.reduce((a, b) => a + b, 0);
            const mean = sum / data.length;
            const scale = 1.5; // Zoom factor

            for (let i = 0; i < data.length; i++) {
                const x = i;
                // Center at height/2, scale deviations from mean
                const val = data[i] - mean;
                // Invert Y because canvas Y grows downwards
                const y = (height / 2) - (val * scale);

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();

            // Add a "scanline" gradient fade at the right if needed, or just standard scope

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            // Ideally unsubscribe from manager? 
            // Our manager doesn't support unsubscribeRaw yet, but it replaces callback.
            // So we can set it to no-op or handle it better later.
        };
    }, []);

    return (
        <div className="w-full bg-gray-900/50 rounded-2xl border border-gray-800 p-6 backdrop-blur-sm">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">Live EEG Signal (Avg)</h3>
            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-black/50 shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={192} // 48 * 4
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}
