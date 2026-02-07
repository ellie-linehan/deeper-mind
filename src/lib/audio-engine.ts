export class NeuroAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    // Layers
    private thetaDrone: OscillatorNode | null = null;
    private thetaGain: GainNode | null = null;

    private alphaPad: OscillatorNode | null = null;
    private alphaGain: GainNode | null = null;

    // Gamma Binaural Layers (Left/Right)
    private gammaLeft: OscillatorNode | null = null;
    private gammaRight: OscillatorNode | null = null;
    private gammaGain: GainNode | null = null;

    private isRunning = false;

    constructor() { }

    async init() {
        if (this.ctx) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();

        // Master Gain
        this.masterGain = this.ctx!.createGain();
        this.masterGain.gain.value = 0.4; // Slightly lower master volume
        this.masterGain.connect(this.ctx!.destination);

        // 1. Theta Drone (Deep Low 55Hz)
        this.thetaDrone = this.ctx!.createOscillator();
        this.thetaDrone.type = 'sine';
        this.thetaDrone.frequency.value = 55;
        this.thetaGain = this.ctx!.createGain();
        this.thetaGain.gain.value = 0;
        this.thetaDrone.connect(this.thetaGain);
        this.thetaGain.connect(this.masterGain);
        this.thetaDrone.start();

        // 2. Alpha Pad (Warm 110Hz)
        this.alphaPad = this.ctx!.createOscillator();
        this.alphaPad.type = 'triangle';
        this.alphaPad.frequency.value = 110;
        this.alphaGain = this.ctx!.createGain();
        this.alphaGain.gain.value = 0;

        // Soften the pad
        const alphaFilter = this.ctx!.createBiquadFilter();
        alphaFilter.type = 'lowpass';
        alphaFilter.frequency.value = 300; // Softer filter

        this.alphaPad.connect(alphaFilter);
        alphaFilter.connect(this.alphaGain);
        this.alphaGain.connect(this.masterGain);
        this.alphaPad.start();

        // 3. Gamma Binaural Beats (40Hz Difference for Gamma Induction)
        // Base Tone: 200Hz (Left)
        // Offset Tone: 240Hz (Right) -> Result: 40Hz beat

        this.gammaGain = this.ctx!.createGain();
        this.gammaGain.gain.value = 0;
        this.gammaGain.connect(this.masterGain);

        // Left Channel
        this.gammaLeft = this.ctx!.createOscillator();
        this.gammaLeft.type = 'sine';
        this.gammaLeft.frequency.value = 200;
        const leftPanner = this.ctx!.createStereoPanner();
        leftPanner.pan.value = -1; // Full Left
        this.gammaLeft.connect(leftPanner);
        leftPanner.connect(this.gammaGain);
        this.gammaLeft.start();

        // Right Channel
        this.gammaRight = this.ctx!.createOscillator();
        this.gammaRight.type = 'sine';
        this.gammaRight.frequency.value = 240; // +40Hz
        const rightPanner = this.ctx!.createStereoPanner();
        rightPanner.pan.value = 1; // Full Right
        this.gammaRight.connect(rightPanner);
        rightPanner.connect(this.gammaGain);
        this.gammaRight.start();

        this.isRunning = true;
    }

    update(brainwaves: { alpha: number, beta: number, theta: number, gamma: number }) {
        if (!this.ctx || !this.isRunning) return;

        const total = brainwaves.alpha + brainwaves.beta + brainwaves.theta + brainwaves.gamma || 1;

        // Normalize (0-1)
        const t = brainwaves.theta / total;
        const a = brainwaves.alpha / total;
        const g = brainwaves.gamma / total;

        const now = this.ctx.currentTime;
        const rampTime = 0.5;

        // Theta: Base presence
        this.thetaGain?.gain.linearRampToValueAtTime(0.1 + (t * 0.2), now + rampTime);

        // Alpha: Swells with relaxation
        this.alphaGain?.gain.linearRampToValueAtTime(a * 0.3, now + rampTime);

        // Gamma: Binaural beats fade in during Flow
        // 40Hz beats are subtle but powerful
        this.gammaGain?.gain.linearRampToValueAtTime(g * 0.25, now + rampTime);
    }

    stop() {
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
            this.isRunning = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

export const neuroAudio = new NeuroAudioEngine();
