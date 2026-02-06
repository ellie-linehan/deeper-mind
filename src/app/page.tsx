"use client";

import { useState } from "react";
// import { brainbitManager } from "@/lib/brainbit"; // Commented out until verified import
// import { getGeminiModel } from "@/lib/gemini";   // Commented out until verified import

export default function Home() {
  const [deviceStatus, setDeviceStatus] = useState("Disconnected");
  const [aiResponse, setAiResponse] = useState("");

  const handleConnect = async () => {
    try {
      setDeviceStatus("Scanning...");
      // In a real scenario:
      // const sensors = await brainbitManager.startScanning();
      // if (sensors.length > 0) await brainbitManager.connect(sensors[0]);
      setTimeout(() => setDeviceStatus("Connected (Simulated)"), 1000);
    } catch (error) {
      console.error(error);
      setDeviceStatus("Connection Failed");
    }
  };

  const handleAnalyze = async () => {
    setAiResponse("Analyzing brainwaves...");
    try {
      // In a real scenario:
      // const model = getGeminiModel();
      // const result = await model.generateContent("Analyze this signal...");
      // setAiResponse(result.response.text());
      setTimeout(() => setAiResponse("Deep Focus State Detected. Suggesting: 5 min break."), 1500);
    } catch (error) {
      console.error(error);
      setAiResponse("Analysis Failed");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold tracking-tight">Deeper Mind</h1>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <div className="p-6 border rounded-lg min-w-[300px] flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Brainbit Device</h2>
            <div className="flex justify-between items-center">
              <span>Status:</span>
              <span className={`font-mono ${deviceStatus.includes("Connected") ? "text-green-500" : "text-yellow-500"}`}>
                {deviceStatus}
              </span>
            </div>
            <button
              onClick={handleConnect}
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Connect Device
            </button>
          </div>

          <div className="p-6 border rounded-lg min-w-[300px] flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Gemini 3 Insights</h2>
            <div className="min-h-[100px] p-4 bg-black/5 rounded text-sm">
              {aiResponse || "Waiting for signal data..."}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!deviceStatus.includes("Connected")}
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50"
            >
              Analyze Pattern
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
