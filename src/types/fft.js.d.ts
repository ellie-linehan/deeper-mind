declare module 'fft.js' {
    export default class FFT {
        constructor(size: number);
        createComplexArray(): number[];
        toComplexArray(input: number[], storage?: number[]): number[];
        transform(out: number[], input: number[]): void;
        inverseTransform(out: number[], input: number[]): void;
        realTransform(out: number[], input: number[]): void;
        completeSpectrum(spectrum: number[]): void;
    }
}
