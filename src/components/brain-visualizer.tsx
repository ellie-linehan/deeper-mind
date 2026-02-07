"use client";

import { useEffect, useRef } from "react";

interface BrainVisualizerProps {
    brainwaves: {
        alpha: number;
        beta: number;
        theta: number;
        gamma: number;
    };
    isActive: boolean;
}

class Blob {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseRadius: number;
    color: string;
    angle: number;
    speed: number;

    constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseRadius = 50 + Math.random() * 100;
        this.radius = this.baseRadius;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.5 + Math.random();
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.color = `hsla(${200 + Math.random() * 60}, 70%, 50%, 0.3)`; // Blue/Purple base
    }

    update(w: number, h: number, energy: number, mood: 'calm' | 'flow') {
        // Move
        this.x += this.vx * energy;
        this.y += this.vy * energy;

        // Bounce
        if (this.x < -100) this.x = w + 100;
        if (this.x > w + 100) this.x = -100;
        if (this.y < -100) this.y = h + 100;
        if (this.y > h + 100) this.y = -100;

        // Pulse/Breathe
        const breath = Math.sin(Date.now() / 1000) * 20;
        this.radius = this.baseRadius + breath + (energy * 10);

        // Color shift based on mood
        if (mood === 'flow') {
            // Shift towards Purple/Gold/White
            this.color = `hsla(${260 + Math.random() * 40}, 80%, ${60 + energy * 20}%, 0.4)`;
        } else {
            // Calm Blue/Cyan
            this.color = `hsla(${200 + Math.random() * 40}, 70%, 50%, 0.3)`;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        // Create gradient
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, this.color);
        g.addColorStop(1, "transparent");

        ctx.fillStyle = g;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export function BrainVisualizer({ brainwaves, isActive }: BrainVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const blobsRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Re-init blobs if needed
            if (blobsRef.current.length === 0) {
                for (let i = 0; i < 15; i++) {
                    blobsRef.current.push(new Blob(canvas.width, canvas.height));
                }
            }
        };
        window.addEventListener('resize', resize);
        resize();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Animation Loop
        let animationId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Black background (or transparent if overlay)
            // ctx.fillStyle = "#000";
            // ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Compositing for "glow"
            ctx.globalCompositeOperation = "screen";

            // Calculate Energy & Mood
            const totalPower = brainwaves.alpha + brainwaves.beta + brainwaves.theta + brainwaves.gamma || 1;
            const gammaPercent = brainwaves.gamma / totalPower;
            const alphaPercent = brainwaves.alpha / totalPower;

            // Energy multiplier (1.0 = normal, 3.0 = high gamma)
            const energy = 1 + (gammaPercent * 2);
            const mood = gammaPercent > 0.25 ? 'flow' : 'calm';

            blobsRef.current.forEach(blob => {
                blob.update(canvas.width, canvas.height, energy, mood);
                blob.draw(ctx);
            });

            animationId = requestAnimationFrame(render);
        };

        if (isActive) {
            render();
        }

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [isActive, brainwaves]);

    return (
        <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ${isActive ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            <canvas ref={canvasRef} className="w-full h-full bg-black" />
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)] pointer-events-none" />
        </div>
    );
}
