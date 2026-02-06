import * as Brainbit from "web-neurosdk-brainbit";

// Define a type for the callback that handles signal data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalCallback = (data: any) => void;

export class BrainbitManager {
    private scanner: any | null = null;
    private sensor: any | null = null;

    async startScanning() {
        if (!this.scanner) {
            this.scanner = new Brainbit.Scanner();
        }
        // Note: This must be triggered by a user gesture
        const sensors = await this.scanner.sensors();
        return sensors;
    }

    async connect(sensorInfo: any) {
        if (this.scanner) {
            this.sensor = await this.scanner.createSensor(sensorInfo);
            return this.sensor;
        }
        throw new Error("Scanner not initialized");
    }

    disconnect() {
        if (this.sensor) {
            this.sensor.disconnect();
            this.sensor = null;
        }
    }
}

export const brainbitManager = new BrainbitManager();
