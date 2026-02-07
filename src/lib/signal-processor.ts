import FFT from 'fft.js';

// Band constants (Hz)
const ALPHA_BAND = [8, 12];
const BETA_BAND = [13, 30];
const THETA_BAND = [4, 8];
const GAMMA_BAND = [30, 49];
const SAMPLING_RATE = 250; // Brainbit sampling rate is typically 250Hz

export interface Brainwaves {
    alpha: number;
    beta: number;
    theta: number;
    gamma: number;
    focusScore: number;
}

export class SignalProcessor {
    private fft: any;
    private windowSize: number;
    private buffer: number[] = [];

    // Filter states
    private hpFilterState = { v: [0, 0] };
    private lpFilterState = { v: [0, 0] };
    private bsFilterState = { v: [0, 0, 0, 0] };

    constructor(windowSize: number = 256) {
        this.windowSize = windowSize;
        this.fft = new FFT(windowSize);
    }

    // Ported filter logic from Brainbit Web SDK Demo
    private filter(filter: any, invar: number, state: any): number {
        let sumden = 0.0;
        let sumnum = 0.0;
        for (let i = 0; i < filter.order; i++) {
            sumden += state.v[i] * filter.denominators[i];
            sumnum += state.v[i] * filter.numerators[i];
            if (i < filter.order - 1) state.v[i] = state.v[i + 1];
        }
        state.v[filter.order - 1] = invar - sumden;
        sumnum += state.v[filter.order - 1] * filter.numerators[filter.order];
        return sumnum;
    }

    // Filter coefficients from demo
    private highPassFilter = {
        order: 2,
        denominators: [0.96508117389913495, -1.9644605802052322],
        numerators: [0.98238543852609173, -1.9647708770521835, 0.98238543852609173]
    };

    private lowPassFilter = {
        order: 2,
        denominators: [0.34766539485172343, -0.98240579310839538],
        numerators: [0.091314900435831972, 0.18262980087166394, 0.091314900435831972]
    };

    private bandStopFilter = {
        order: 4,
        denominators: [0.7008967811884026, -0.94976030879978701, 1.9723023606063141, -1.136085493907057],
        numerators: [0.8370891905663449, -1.0429229013534211, 1.9990207606620285, -1.0429229013534211, 0.8370891905663449]
    };

    processSample(sample: number): Brainwaves | null {
        // Apply filters in sequence: HighPass -> LowPass -> BandStop
        let filtered = this.filter(this.highPassFilter, sample, this.hpFilterState);
        filtered = this.filter(this.lowPassFilter, filtered, this.lpFilterState);
        filtered = this.filter(this.bandStopFilter, filtered, this.bsFilterState);

        this.buffer.push(filtered);

        if (this.buffer.length >= this.windowSize) {
            const result = this.computeSpectralPower(this.buffer);
            // Overlap: remove half the buffer
            this.buffer = this.buffer.slice(this.windowSize / 2);
            return result;
        }

        return null;
    }

    private computeSpectralPower(data: number[]): Brainwaves {
        const out = this.fft.createComplexArray();
        this.fft.toComplexArray(data, out);
        const spectrum = this.fft.createComplexArray();
        this.fft.transform(spectrum, out);

        const magnitudes: number[] = [];
        // Calculate magnitude for first half of spectrum (Nyquist)
        for (let i = 0; i < this.windowSize / 2; i++) {
            const real = spectrum[2 * i];
            const imag = spectrum[2 * i + 1];
            magnitudes.push(Math.sqrt(real * real + imag * imag));
        }

        const alpha = this.getBandPower(magnitudes, ALPHA_BAND);
        const beta = this.getBandPower(magnitudes, BETA_BAND);
        const theta = this.getBandPower(magnitudes, THETA_BAND);
        const gamma = this.getBandPower(magnitudes, GAMMA_BAND);

        // Simple Focus Score: Beta / (Alpha + Theta)
        // Ratio often used as "Beta/Theta" or "Beta/Alpha" index
        // Prevent division by zero
        const denominator = (alpha + theta) || 1;
        const focusScore = Math.min(100, Math.max(0, (beta / denominator) * 10)); // Scaling factor

        return { alpha, beta, theta, gamma, focusScore };
    }

    private getBandPower(magnitudes: number[], band: number[]): number {
        const freqRes = SAMPLING_RATE / this.windowSize;
        const startIndex = Math.floor(band[0] / freqRes);
        const endIndex = Math.ceil(band[1] / freqRes);

        let sum = 0;
        for (let i = startIndex; i <= endIndex && i < magnitudes.length; i++) {
            sum += magnitudes[i];
        }
        return sum / (endIndex - startIndex + 1); // Average power
    }
}
