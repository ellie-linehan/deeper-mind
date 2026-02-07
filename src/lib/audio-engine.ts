export class NeuroAudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    // Layers
    private thetaDrone: OscillatorNode | null = null;
    private thetaGain: GainNode | null = null;

    private alphaPad: OscillatorNode | null = null;
    private alphaGain: GainNode | null = null;

    private gammaShimmer: OscillatorNode | null = null;
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
        this.masterGain.gain.value = 0.5; // Master volume
        this.masterGain.connect(this.ctx!.destination);

        // 1. Theta Drone (Deep Low 55Hz - A1)
        this.thetaDrone = this.ctx!.createOscillator();
        this.thetaDrone.type = 'sine';
        this.thetaDrone.frequency.value = 55;
        this.thetaGain = this.ctx!.createGain();
        this.thetaGain.gain.value = 0;
        this.thetaDrone.connect(this.thetaGain);
        this.thetaGain.connect(this.masterGain);
        this.thetaDrone.start();

        // 2. Alpha Pad (Warm 110Hz - A2 + minor detune)
        this.alphaPad = this.ctx!.createOscillator();
        this.alphaPad.type = 'triangle'; // Richer tone
        this.alphaPad.frequency.value = 110;
        this.alphaGain = this.ctx!.createGain();
        this.alphaGain.gain.value = 0;
        // Simple filter to soften the triangle wave
        const alphaFilter = this.ctx!.createBiquadFilter();
        alphaFilter.type = 'lowpass';
        alphaFilter.frequency.value = 400;

        this.alphaPad.connect(alphaFilter);
        alphaFilter.connect(this.alphaGain);
        this.alphaGain.connect(this.masterGain);
        this.alphaPad.start();

        // 3. Gamma Shimmer (High 440Hz - A4)
        this.gammaShimmer = this.ctx!.createOscillator();
        this.gammaShimmer.type = 'sine';
        this.gammaShimmer.frequency.value = 440;
        this.gammaGain = this.ctx!.createGain();
        this.gammaGain.gain.value = 0;

        // Tremolo effect for "shimmer"
        const tremolo = this.ctx!.createOscillator();
        tremolo.frequency.value = 8; // 8Hz shimmer
        const tremoloGain = this.ctx!.createGain();
        tremoloGain.gain.value = 200; // Depth
        tremolo.connect(tremoloGain);
        // Note: To properly modulate gain, we'd need a more complex graph, 
        // but for now let's just use it as a pure tone layer.

        this.gammaShimmer.connect(this.gammaGain);
        this.gammaGain.connect(this.masterGain);
        this.gammaShimmer.start();

        this.isRunning = true;
    }

    update(brainwaves: { alpha: number, beta: number, theta: number, gamma: number }) {
        if (!this.ctx || !this.isRunning) return;

        const total = brainwaves.alpha + brainwaves.beta + brainwaves.theta + brainwaves.gamma || 1;

        // Normalize (0-1)
        const t = brainwaves.theta / total;
        const a = brainwaves.alpha / total;
        const g = brainwaves.gamma / total;

        // Smooth transitions (exponential ramp is better but simple lerp works for update loop)
        const now = this.ctx.currentTime;
        const rampTime = 0.5; // 500ms smooth

        // Theta: Always present as base, boosts when drowsy
        // Base 0.1, max 0.4
        this.thetaGain?.gain.linearRampToValueAtTime(0.1 + (t * 0.3), now + rampTime);

        // Alpha: Swells when relaxing
        // Base 0.0, max 0.3
        this.alphaGain?.gain.linearRampToValueAtTime(a * 0.4, now + rampTime);

        // Gamma: Shimmers when flowing
        // Base 0.0, max 0.2 (high freq is perceived louder)
        this.gammaGain?.gain.linearRampToValueAtTime(g * 0.3, now + rampTime);
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
