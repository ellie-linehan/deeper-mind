"use client";

import { useState } from "react";
import { brainbitManager } from "@/lib/brainbit";
import { getGeminiModel } from "@/lib/gemini";
import { SignalCheckModal } from "@/components/signal-check-modal";
import { SignalGraph } from "@/components/signal-graph";

export default function Home() {
  const [deviceStatus, setDeviceStatus] = useState("Disconnected");
  const [aiResponse, setAiResponse] = useState("");
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sensor, setSensor] = useState<any>(null);
  const [startAnalysis, setStartAnalysis] = useState(false);
  const [brainwaves, setBrainwaves] = useState({ alpha: 0, beta: 0, theta: 0, gamma: 0 });
  const [resistances, setResistances] = useState({ O1: Infinity, O2: Infinity, T3: Infinity, T4: Infinity });

  const setupResistanceSubscription = () => {
    brainbitManager.subscribeToResistance((data) => {
      setResistances({
        T3: data.resistanceCh1 ?? Infinity,
        T4: data.resistanceCh2 ?? Infinity,
        O1: data.resistanceCh3 ?? Infinity,
        O2: data.resistanceCh4 ?? Infinity
      });
    });
  };

  const handleConnect = async () => {
    try {
      setDeviceStatus("Connecting...");
      // BrainbitClient.connect() handles both the device picker and the connection
      const connectedClient = await brainbitManager.connect();
      setSensor(connectedClient);
      setDeviceStatus("Connected");

      // Open signal check modal on successful connection
      setIsSignalModalOpen(true);

      // Subscribe to signal updates for later
      brainbitManager.subscribe((data) => {
        setBrainwaves({
          alpha: parseFloat(data.alpha.toFixed(2)),
          beta: parseFloat(data.beta.toFixed(2)),
          theta: parseFloat(data.theta.toFixed(2)),
          gamma: parseFloat(data.gamma.toFixed(2))
        });
      });

      // Start Resistance immediately (this is the ONLY GATT op now)

      // Start and subscribe to resistance data
      await brainbitManager.startResistance();
      setupResistanceSubscription();

    } catch (error) {
      console.error(error);
      setDeviceStatus("Connection Failed");
    }
  };

  const handleStartSession = async () => {
    setIsSignalModalOpen(false);
    try {
      await brainbitManager.stopResistance();
      // Small delay to ensure GATT is free
      await new Promise(r => setTimeout(r, 1500));
      await brainbitManager.startEEG();
    } catch (e) {
      console.error("Failed to start session:", e);
    }
  };

  const handleSignalCheck = async () => {
    try {
      await brainbitManager.stopEEG();
      await new Promise(r => setTimeout(r, 1500));
      await brainbitManager.startResistance();
      setupResistanceSubscription(); // <--- Re-subscribe here!
      setIsSignalModalOpen(true);
    } catch (e) {
      console.error("Error switching to signal check:", e);
    }
  };

  const getSignalColor = (r: number) => {
    // < 200kOhm is generally considered good contact for Brainbit
    if (r < 200000) return "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
    if (r < 1000000) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleAnalyze = async () => {
    if (!sensor && deviceStatus !== "Connected") {
      // Optional: Error or mock mode
    }

    setStartAnalysis(true);
    setAiResponse("Analyzing your brain activity...");

    try {
      const model = getGeminiModel();
      const totalPower = brainwaves.alpha + brainwaves.beta + brainwaves.theta + brainwaves.gamma || 1;
      const getPercent = (val: number) => Math.round((val / totalPower) * 100);

      // Construct a prompt with relative power metrics
      const prompt = `
        You are a neurofeedback expert. 
        Analyze the following real-time brainwave data (Relative Power %):
        - Gamma (Flow/Peak Performance): ${getPercent(brainwaves.gamma)}%
        - Beta (Active Focus/Stress): ${getPercent(brainwaves.beta)}%
        - Alpha (Relaxation): ${getPercent(brainwaves.alpha)}%
        - Theta (Drowsiness/Autopilot): ${getPercent(brainwaves.theta)}%
        
        Raw Amplitudes (uV):
        Gamma: ${brainwaves.gamma} | Beta: ${brainwaves.beta} | Alpha: ${brainwaves.alpha} | Theta: ${brainwaves.theta}

        Provide a concise (2-3 sentence) insight.
        - IGNORE "Focus Score" (it is deprecated).
        - If Gamma is dominant (>25%), praise the "Flow State".
        - If Theta/Alpha is dominant, suggest waking up or engaging in a challenge.
        - If Beta is very high (>40%), warn about potential stress.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiResponse(response.text());
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error("Gemini Error:", error);
      setAiResponse(`Analysis Failed: ${error.message}`);
    } finally {
      setStartAnalysis(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-900 selection:text-white">
      <SignalCheckModal
        isOpen={isSignalModalOpen}
        onClose={() => setIsSignalModalOpen(false)}
        onStartSession={handleStartSession}
        resistances={resistances}
      />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Deeper Mind
            </h1>
            <p className="text-gray-400 text-sm tracking-wide">GEMINI 3 HACKATHON • BRAINBIT INTEGRATION</p>
          </div>
          <div className="flex items-center gap-6">
            {/* Signal Indicators */}
            {deviceStatus === "Connected" && (
              <button
                onClick={handleSignalCheck}
                className="flex gap-3 bg-gray-900/80 p-2.5 rounded-xl border border-gray-800 backdrop-blur-sm hover:border-gray-600 transition-colors"
                title="Check Signal Quality"
              >
                {["T3", "O1", "O2", "T4"].map((ch) => (
                  <div key={ch} className="flex flex-col items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${getSignalColor((resistances as any)[ch])}`} />
                    <span className="text-[9px] text-gray-500 font-mono font-bold">{ch}</span>
                  </div>
                ))}
              </button>
            )}

            <div className={`text-xs px-3 py-1.5 rounded-full font-mono uppercase tracking-wider ${deviceStatus === "Connected" ? "bg-green-950/50 text-green-400 border border-green-800" :
              deviceStatus === "Connecting..." ? "bg-yellow-950/50 text-yellow-400 border border-yellow-800" :
                "bg-red-950/50 text-red-400 border border-red-800"
              }`}>
              {deviceStatus}
            </div>
            {deviceStatus !== "Connected" && (
              <button
                onClick={handleConnect}
                className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all hover:scale-105 active:scale-95"
              >
                Connect Device
              </button>
            )}
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Alpha (Relax)", value: brainwaves.alpha, color: "text-blue-400", border: "hover:border-blue-500/50" },
              { label: "Beta (Focus)", value: brainwaves.beta, color: "text-purple-400", border: "hover:border-purple-500/50" },
              { label: "Theta (Drowsy)", value: brainwaves.theta, color: "text-pink-400", border: "hover:border-pink-500/50" },
              { label: "Gamma (Flow)", value: brainwaves.gamma, color: "text-orange-400", border: "hover:border-orange-500/50" }
            ].map((metric) => {
              const total = brainwaves.alpha + brainwaves.beta + brainwaves.theta + brainwaves.gamma || 1;
              const percent = Math.round((metric.value / total) * 100);

              return (
                <div key={metric.label} className={`bg-gray-900/50 p-6 rounded-2xl border border-gray-800 transition-colors ${metric.border}`}>
                  <div className={`text-xs ${metric.color} uppercase tracking-widest font-semibold mb-2`}>{metric.label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-mono text-gray-200">{metric.value}</div>
                    <div className="text-sm text-gray-500 font-mono">µV</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${metric.color.replace('text-', 'bg-')} transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 font-mono w-8 text-right">{percent}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <SignalGraph />
        </section>

        {/* AI Analysis */}
        <section className="space-y-6 pt-12 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light text-gray-200">Gemini Insight</h2>
            <button
              onClick={handleAnalyze}
              disabled={startAnalysis}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25"
            >
              {startAnalysis ? "Analyzing..." : "Analyze Pattern"}
            </button>
          </div>

          <div className="min-h-[160px] bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-gray-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]" />
            {aiResponse ? (
              <p className="text-gray-300 text-lg leading-relaxed relative z-10 animate-in fade-in zoom-in-95 duration-500">
                {aiResponse}
              </p>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-600 text-sm relative z-10">
                Waiting for analysis...
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
