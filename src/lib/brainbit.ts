// Brainbit SDK is loaded dynamically to avoid SSR issues with 'window' reference in UMD
// import BrainbitClient from "web-neurosdk-brainbit";
import { SignalProcessor, Brainwaves } from "./signal-processor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalCallback = (data: Brainwaves) => void;

export type ChannelData = {
    T3: number;
    T4: number;
    O1: number;
    O2: number;
};

export class BrainbitManager {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private client: any | null = null;
    private signalProcessor: SignalProcessor;
    private onSignalCallback: SignalCallback | null = null;
    private onRawDataCallback: ((data: ChannelData) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eegSubscription: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private resistanceSubscription: any = null;

    constructor() {
        this.signalProcessor = new SignalProcessor();
    }

    async connect() {
        if (!this.client) {
            // Dynamically import the SDK only on the client side
            const brainbitModule = await import("web-neurosdk-brainbit");
            // Handle potential default export differences
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const BrainbitClient = (brainbitModule as any).default || brainbitModule;
            this.client = new BrainbitClient();
        }
        try {
            await this.client.connect();

            // WE DO NOT START EEG STREAM HERE ANYMORE
            // This prevents GATT collision with Resistance check.

            return this.client;
        } catch (error) {
            console.error("Failed to connect:", error);
            throw error;
        }
    }

    async startEEG() {
        if (!this.client) return;

        // Subscribe if not already
        if (!this.eegSubscription) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.eegSubscription = await this.client.eegStream.subscribe((data: any) => {
                const avgSample = (data.val0_ch1 + data.val0_ch2 + data.val0_ch3 + data.val0_ch4) / 4;
                // Convert Volts to MicroVolts (uV) to avoid values near zero
                const scaledSample = avgSample * 1000000;

                // Emit raw data for visualization (all channels)
                if (this.onRawDataCallback) {
                    this.onRawDataCallback({
                        T3: data.val0_ch1 * 1000000,
                        T4: data.val0_ch2 * 1000000,
                        O1: data.val0_ch3 * 1000000,
                        O2: data.val0_ch4 * 1000000
                    });
                }

                const result = this.signalProcessor.processSample(scaledSample);
                if (result && this.onSignalCallback) {
                    this.onSignalCallback(result);
                }
            });
        }

        await this.client.startEEGStream();
    }

    async stopEEG() {
        if (this.client) {
            await this.client.stopEEGStream();
        }
    }

    async startResistance() {
        if (this.client) {
            await this.client.startResistanceData();
        }
    }

    async stopResistance() {
        if (this.client) {
            if (this.resistanceSubscription) {
                this.resistanceSubscription.unsubscribe();
                this.resistanceSubscription = null;
            }
            await this.client.stopResistanceData();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscribeToResistance(callback: (data: any) => void) {
        if (this.client) {
            this.resistanceSubscription = this.client.resistanceData.subscribe(callback);
            return this.resistanceSubscription;
        }
    }

    disconnect() {
        if (this.client) {
            if (this.eegSubscription) {
                this.eegSubscription.unsubscribe();
                this.eegSubscription = null;
            }
            // Stop resistance if running (best practice)
            try {
                this.client.stopResistanceData();
            } catch (e) { /* ignore */ }

            this.client.disconnect();
            this.client = null;
        }
    }

    subscribe(callback: SignalCallback) {
        this.onSignalCallback = callback;
    }

    subscribeRaw(callback: (data: ChannelData) => void) {
        this.onRawDataCallback = callback;
    }

    getClient() {
        return this.client;
    }
}

export const brainbitManager = new BrainbitManager();
