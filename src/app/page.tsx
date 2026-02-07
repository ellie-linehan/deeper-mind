"use client";

import { useState } from "react";
import { brainbitManager } from "@/lib/brainbit";
import { getGeminiModel } from "@/lib/gemini";
import { SignalCheckModal } from "@/components/signal-check-modal";
import { SignalGraph } from "@/components/signal-graph";
import { BrainVisualizer } from "@/components/brain-visualizer";
import { useNeuroSession } from "@/hooks/use-neuro-session";

export default function Home() {
  const [brainwaves, setBrainwaves] = useState({ alpha: 0, beta: 0, theta: 0, gamma: 0 });
  const [deviceStatus, setDeviceStatus] = useState("Disconnected");
  const [aiResponse, setAiResponse] = useState("");
  const [isSignalModalOpen, setIsSignalModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sensor, setSensor] = useState<any>(null);

  // --- Demo Mode State (Hoisted) ---
  const [isDemoMode, setIsDemoMode] = useState(false);
  const session = useNeuroSession(brainwaves, isDemoMode);

  // Use session.activeBrainwaves for visualization if in session/demo, otherwise real brainwaves
  const displayBrainwaves = (session.isActive || isDemoMode) ? session.activeBrainwaves : brainwaves;
  // --------------------------------

  const [startAnalysis, setStartAnalysis] = useState(false);
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
      // Use displayBrainwaves (handles Demo Mode)
      const bw = displayBrainwaves;
      const totalPower = bw.alpha + bw.beta + bw.theta + bw.gamma || 1;
      const getPercent = (val: number) => Math.round((val / totalPower) * 100);

      // Construct a prompt with relative power metrics
      // Construct a prompt with relative power metrics
      const prompt = `
        You are a neurofeedback expert. 
        Perform a "Pre-Session Check" for a user about to enter a "Deep Flow" neurofeedback session.
        
        Real-time Relative Power (%):
        - Gamma (Flow/Peak Performance): ${getPercent(bw.gamma)}%
        - Beta (Active Focus/Stress): ${getPercent(bw.beta)}%
        - Alpha (Relaxation): ${getPercent(bw.alpha)}%
        - Theta (Drowsiness/Autopilot): ${getPercent(bw.theta)}%
        
        Task:
        1. State the user's *current* mental state in one short sentence (e.g., "You are currently in a relaxed, drifting state.").
        2. Provide *one* actionable tip to prepare for Deep Flow based on this state.
           - If Theta/Alpha is >50%: "Try taking a few sharp, quick breaths to wake up your cortex."
           - If Beta is >40%: "Take 3 deep, slow breaths to clear mental clutter."
           - If Gamma is >25%: "You are already primed for flow. Dive in immediately."
        
        Keep it encouraging and under 30 words total.
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
    <main className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-900 selection:text-white relative overflow-hidden">
      {/* Demo Mode Badge */}
      {isDemoMode && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 bg-purple-600/90 text-white text-[10px] font-bold px-3 py-1 rounded-b-lg z-50 shadow-[0_0_20px_rgba(147,51,234,0.5)]">
          DEMO DATA ACTIVE
        </div>
      )
      }

      <SignalCheckModal
        isOpen={isSignalModalOpen}
        onClose={() => setIsSignalModalOpen(false)}
        onStartSession={handleStartSession}
        resistances={resistances}
      />

      {/* Immersive Visualizer Background */}
      <BrainVisualizer brainwaves={brainwaves} isActive={session.isActive} />

      {/* Immersive Session Overlay */}
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-1000 ${session.isActive ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute top-8 right-8 pointer-events-auto">
          <button onClick={() => session.stopSession()} className="text-white/50 hover:text-white px-4 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest backdrop-blur-md transition-all">
            End Session
          </button>
        </div>

        <div className="text-center space-y-6 max-w-2xl px-6">
          <div className="space-y-2">
            <div className="text-blue-400 text-xs font-mono uppercase tracking-[0.2em]">{session.phase}</div>
            <div className="text-6xl font-thin text-white tracking-tight">
              {Math.floor(session.timeLeft / 60)}:{(session.timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          <p className="text-xl text-white/80 font-light leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000">
            "{session.guidance}"
          </p>
        </div>
      </div>

      <div className={`max-w-4xl mx-auto space-y-12 relative z-10 transition-opacity duration-1000 ${session.isActive ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
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

            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`text-xs px-4 py-2 rounded-full font-mono uppercase tracking-wider border transition-all ${isDemoMode
                ? "bg-purple-900/50 text-purple-300 border-purple-500/50"
                : "bg-gray-900/50 text-gray-500 border-gray-800 hover:border-gray-600"}`}
            >
              {isDemoMode ? "Demo Active" : "Try Demo"}
            </button>
          </div>
        </header>

        {/* Primary Actions */}
        {/* Primary Actions */}
        <div className="flex justify-center animate-in fade-in zoom-in-95 duration-700 py-4">
          <button
            onClick={() => session.startSession()}
            className="group relative px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl font-bold text-white shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-4 overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
            <span className="relative w-3 h-3 rounded-full bg-white animate-pulse" />
            <span className="relative text-lg tracking-wide">Start Deep Flow Session</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Alpha (Relax)", value: displayBrainwaves.alpha, color: "text-blue-400", bg: "bg-blue-400", border: "hover:border-blue-500/50" },
              { label: "Beta (Focus)", value: displayBrainwaves.beta, color: "text-purple-400", bg: "bg-purple-400", border: "hover:border-purple-500/50" },
              { label: "Theta (Drowsy)", value: displayBrainwaves.theta, color: "text-pink-400", bg: "bg-pink-400", border: "hover:border-pink-500/50" },
              { label: "Gamma (Flow)", value: displayBrainwaves.gamma, color: "text-orange-400", bg: "bg-orange-400", border: "hover:border-orange-500/50" }
            ].map((metric) => {
              const total = displayBrainwaves.alpha + displayBrainwaves.beta + displayBrainwaves.theta + displayBrainwaves.gamma || 1;
              const percent = Math.round((metric.value / total) * 100);

              return (
                <div key={metric.label} className={`bg-gray-900/50 p-6 rounded-2xl border border-gray-800 transition-colors ${metric.border}`}>
                  <div className={`text-xs ${metric.color} uppercase tracking-widest font-semibold mb-2`}>{metric.label}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-mono text-gray-200">{metric.value.toFixed(1)}</div>
                    <div className="text-sm text-gray-500 font-mono">µV</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${metric.bg} transition-all duration-500`} style={{ width: `${percent}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 font-mono w-8 text-right">{percent}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <SignalGraph isDemoMode={isDemoMode} />
        </section>

        {/* AI Analysis */}
        <section className="space-y-6 pt-12 border-t border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-light text-gray-200">Pre-Session Calibration</h2>
            <div className="flex gap-4">
              <button
                onClick={handleAnalyze}
                disabled={startAnalysis}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-purple-500/25"
              >
                {startAnalysis ? "Analyzing..." : "Analyze Current State"}
              </button>


            </div>
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
    </main >
  );
}
