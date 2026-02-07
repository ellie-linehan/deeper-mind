"use client";

import { useEffect, useRef } from "react";
import { brainbitManager, ChannelData } from "@/lib/brainbit";

// Simple IIR High-pass filter to remove DC drift
class HighPassFilter {
    private alpha: number;
    private lastInput: number = 0;
    private lastOutput: number = 0;

    constructor(cutoff: number, sampleRate: number) {
        const rc = 1.0 / (2 * Math.PI * cutoff);
        const dt = 1.0 / sampleRate;
        this.alpha = rc / (rc + dt);
    }

    process(input: number): number {
        const output = this.alpha * (this.lastOutput + input - this.lastInput);
        this.lastInput = input;
        this.lastOutput = output;
        return output;
    }
}

export function SignalGraph({ isDemoMode = false }: { isDemoMode?: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dataRef = useRef<{ T3: number; T4: number; O1: number; O2: number }[]>([]);

    // Filters for each channel (0.5Hz cutoff to remove slow drift)
    const filters = useRef({
        T3: new HighPassFilter(0.5, 250),
        T4: new HighPassFilter(0.5, 250),
        O1: new HighPassFilter(0.5, 250),
        O2: new HighPassFilter(0.5, 250)
    });

    // Buffer size: 250Hz * 5s = 1250 samples
    const BUFFER_SIZE = 1250;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Reset data on mount/mode toggle
        dataRef.current = [];

        let demoInterval: NodeJS.Timeout;

        // 1. Subscribe to REAL raw data if NOT demo
        if (!isDemoMode) {
            brainbitManager.subscribeRaw((sample) => {
                const filteredSample = {
                    T3: filters.current.T3.process(sample.T3),
                    T4: filters.current.T4.process(sample.T4),
                    O1: filters.current.O1.process(sample.O1),
                    O2: filters.current.O2.process(sample.O2)
                };
                dataRef.current.push(filteredSample);
                if (dataRef.current.length > BUFFER_SIZE) dataRef.current.shift();
            });
        }
        // 2. Generate SIMULATED raw data if DEMO
        else {
            let t = 0;
            demoInterval = setInterval(() => {
                // Generate ~25 points per 100ms interval to mimic ~250Hz stream roughly
                // Actually, let's just push batches to be efficient
                for (let i = 0; i < 5; i++) {
                    t += 0.004; // 1/250s

                    // Synthetic EEG: Mix of frequencies + noise
                    const signal = (freq: number, phase: number) => Math.sin(t * Math.PI * 2 * freq + phase);
                    // Boosted noise to match realistic sensor floor (~20-30uV)
                    const noise = () => (Math.random() - 0.5) * 50;

                    // Create slightly different signals per channel
                    // Multipliers increased 5x to match the 0.05 px/uV sensitivity (needs ~500uV for full swing)
                    const sample = {
                        T3: (signal(10, 0) * 100) + (signal(2, 0) * 200) + noise(), // Alpha heavy
                        T4: (signal(15, 1) * 80) + (signal(3, 1) * 150) + noise(), // Beta mix
                        O1: (signal(10, 2) * 120) + (signal(1, 2) * 250) + noise(), // Strong Alpha/Delta
                        O2: (signal(10, 3) * 120) + (signal(1, 3) * 250) + noise()
                    };

                    dataRef.current.push(sample);
                    if (dataRef.current.length > BUFFER_SIZE) dataRef.current.shift();
                }
            }, 20); // 50Hz update loop generating 250Hz data
        }

        let animationFrameId: number;

        const draw = () => {
            if (!canvas || !ctx) return;

            // Clear entire canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const data = dataRef.current;
            const channels: (keyof ChannelData)[] = ['T3', 'T4', 'O1', 'O2'];

            // Layout constants
            const padding = 10;
            const channelHeight = (canvas.height - (padding * (channels.length + 1))) / channels.length;
            const colors = {
                T3: '#60a5fa', // Blue
                T4: '#a78bfa', // Purple
                O1: '#f472b6', // Pink
                O2: '#fb923c'  // Orange
            };

            // Scale settings
            const sensitivity = 0.05; // Pixels per uV (Drastically reduced for high amplitude)

            channels.forEach((ch, index) => {
                const topY = padding + (index * (channelHeight + padding));
                const bottomY = topY + channelHeight;
                const centerY = topY + (channelHeight / 2);

                // Draw channel background/guides
                ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
                ctx.fillRect(0, topY, canvas.width, channelHeight);

                // Zero line
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.moveTo(0, centerY);
                ctx.lineTo(canvas.width, centerY);
                ctx.stroke();

                // Channel Label
                ctx.fillStyle = colors[ch];
                ctx.font = 'bold 12px monospace';
                ctx.fillText(ch, 10, topY + 20);

                // Scale Label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '10px monospace';
                ctx.textAlign = 'right';
                ctx.fillText("800uV", canvas.width - 10, topY + 15); // Updated label
                ctx.textAlign = 'left';

                if (data.length === 0) return;

                // Draw Signal
                ctx.save();
                // Clip to channel area to prevent bleed
                ctx.beginPath();
                ctx.rect(0, topY, canvas.width, channelHeight);
                ctx.clip();

                ctx.beginPath();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = colors[ch];
                ctx.lineJoin = 'round';

                for (let i = 0; i < data.length; i++) {
                    const x = (i / BUFFER_SIZE) * canvas.width;
                    // Invert Y for canvas
                    const val = data[i][ch];
                    const y = centerY - (val * sensitivity);

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (demoInterval) clearInterval(demoInterval);
        };
    }, [isDemoMode]); // Re-run effect when mode changes

    return (
        <div className="w-full bg-gray-900/50 rounded-2xl border border-gray-800 p-6 backdrop-blur-sm">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">Live EEG Signal (Single Channel View)</h3>
            <div className="relative h-96 w-full overflow-hidden rounded-lg bg-black/50 shadow-inner">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={384}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
}
