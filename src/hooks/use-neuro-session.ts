"use client";

import { useState, useEffect, useRef } from "react";
import { neuroAudio } from "@/lib/audio-engine";
import { getGeminiModel } from "@/lib/gemini";

// Protocol Stages
const STAGES = [
    { name: "Calibration", duration: 120, target: "Relax body, reduce Beta" }, // 0-2 min
    { name: "Alpha Induction", duration: 180, target: "Deep relaxation, visualize blue" }, // 2-5 min (3 min)
    { name: "Gamma Flow", duration: 120, target: "Focus, visualize gold/white light" } // 5-7 min (2 min)
];

import { generateSimulatedBrainwaves } from "@/lib/data-simulator";

export function useNeuroSession(realBrainwaves: { alpha: number, beta: number, theta: number, gamma: number }, isDemoMode = false) {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(420); // 7 mins
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [guidance, setGuidance] = useState("Welcome to Deeper Mind. Close your eyes and breathe.");

    const [simulatedBrainwaves, setSimulatedBrainwaves] = useState(realBrainwaves);

    // Determines which data source to use
    const activeBrainwaves = isDemoMode ? simulatedBrainwaves : realBrainwaves;
    const brainwavesRef = useRef(activeBrainwaves);

    // Simulation Loop (Runs if Demo Mode is ON, even if session is not active)
    useEffect(() => {
        if (!isDemoMode) return;

        const simInterval = setInterval(() => {
            // If session is active, use current stage. If not, simulate "Calibration" (Idle)
            const stageName = isActive ? STAGES[currentStageIndex].name : "Calibration";

            const nextData = generateSimulatedBrainwaves(timeLeft, stageName as any);
            setSimulatedBrainwaves(nextData);
            brainwavesRef.current = nextData;
        }, 100); // 10Hz Sim update

        return () => clearInterval(simInterval);
    }, [isActive, isDemoMode, timeLeft, currentStageIndex]);

    // Audio Engine Update
    useEffect(() => {
        if (isActive) {
            neuroAudio.update(activeBrainwaves);
        }
    }, [activeBrainwaves, isActive]);

    // Timer & Stage Logic
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    stopSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive]);

    // Derive Stage from Time Left
    useEffect(() => {
        const elapsed = 420 - timeLeft;
        let stage = 0;
        if (elapsed < 120) stage = 0; // 0-2m
        else if (elapsed < 300) stage = 1; // 2-5m
        else stage = 2; // 5-7m

        if (stage !== currentStageIndex) {
            setCurrentStageIndex(stage);
            speak(`Entering Phase ${stage + 1}: ${STAGES[stage].name}`);
        }
    }, [timeLeft]);

    // --- Refactor for Stability ---
    // Ensure brainwavesRef always points to the ACTIVE data source (Real or Simulated)
    useEffect(() => {
        brainwavesRef.current = activeBrainwaves;
    }, [activeBrainwaves]);

    const chatSession = useRef<any>(null);

    // Initialize Chat & Run Guidance Loop
    useEffect(() => {
        if (!isActive) return;

        // Initialize Chat if needed
        if (!chatSession.current) {
            const model = getGeminiModel();
            chatSession.current = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{
                            text: `
                    System: You are the "Deeper Mind" neurofeedback guide.
                    Protocol: 7 Minutes.
                    - Phase 1 (0-2m): Calibration (Reduce Tension).
                    - Phase 2 (2-5m): Deep Relaxation (Open Monitoring).
                    - Phase 3 (5-7m): Flow State (Peak Focus).
                    
                    CRITICAL INSTRUCTION:
                    - NEVER use technical terms like "Alpha", "Beta", "Theta", "Gamma".
                    - INSTEAD use: "Relaxation", "Tension", "Drowsiness", "Flow/Focus".
                    - NEVER use percentages or numbers.
                    - Use qualitative trends: "Your flow is deepening", "Tension is rising", "You are drifting".
                    - Output: ONE short, soothing, spoken sentence (under 15 words).
                ` }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "Understood. I will use simple, qualitative terms and a soothing tone." }]
                    }
                ]
            });
        }

        const guideInterval = setInterval(async () => {
            if (!chatSession.current) return;

            const bw = brainwavesRef.current;
            const stage = STAGES[currentStageIndex];
            const total = bw.alpha + bw.beta + bw.theta + bw.gamma || 1;

            // Send live data
            const msg = `
              Session Time: ${420 - timeLeft}s.
              Phase: ${stage.name}.
              Relaxation (Alpha): ${Math.round(bw.alpha / total * 100)}%
              Tension (Beta): ${Math.round(bw.beta / total * 100)}%
              Drowsiness (Theta): ${Math.round(bw.theta / total * 100)}%
              Flow (Gamma): ${Math.round(bw.gamma / total * 100)}%
              
              Guidance?
            `;

            try {
                const result = await chatSession.current.sendMessage(msg);
                const text = result.response.text();
                setGuidance(text);
                speak(text);
            } catch (e) { console.error(e); }
        }, 30000); // 30s Check-in

        return () => clearInterval(guideInterval);
    }, [isActive, currentStageIndex]); // Only re-run if active state or stage changes

    const startSession = async () => {
        setIsActive(true);
        setTimeLeft(420);
        setCurrentStageIndex(0);
        await neuroAudio.init();
        speak("Starting Deeper Mind Protocol. Close your eyes.");
    };

    const stopSession = () => {
        setIsActive(false);
        neuroAudio.stop();
        setGuidance("Session Complete.");
        speak("Session Complete. Open your eyes.");
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any pending speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.85; // Slower
            utterance.pitch = 0.9; // Deeper

            // Try to find a better voice
            const voices = window.speechSynthesis.getVoices();
            // Priority: "Google US English" (Chrome), "Microsoft Zira" (Edge/Win), or any "Female"
            const preferredVoice = voices.find(v => v.name.includes("Google US English")) ||
                voices.find(v => v.name.includes("Zira")) ||
                voices.find(v => v.name.includes("Female"));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    };

    // Pre-load voices (Chrome requires this)
    useEffect(() => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    }, []);

    return {
        isActive,
        timeLeft,
        phase: STAGES[currentStageIndex].name,
        guidance,
        startSession,
        stopSession,
        activeBrainwaves
    };
}
