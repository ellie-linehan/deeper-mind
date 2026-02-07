"use client";

interface SignalCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartSession: () => void;
    resistances: { O1: number, O2: number, T3: number, T4: number };
}

interface SignalCheckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartSession: () => void;
    resistances: { O1: number, O2: number, T3: number, T4: number };
}

export function SignalCheckModal({ isOpen, onClose, onStartSession, resistances }: SignalCheckModalProps) {
    // Internal state removed, using props

    // Effect removed, parent handles data fetching

    const getSignalStatus = (r: number) => {
        if (r < 200000) return { label: "Good", color: "text-green-400", bg: "bg-green-500" };
        if (r < 1000000) return { label: "Fair", color: "text-yellow-400", bg: "bg-yellow-500" };
        return { label: "Poor", color: "text-red-400", bg: "bg-red-500" };
    };

    if (!isOpen) return null;

    const allGood = Object.values(resistances).every(r => r < 1000000); // Allow Fair for start

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Signal Check</h2>
                    <p className="text-gray-400 text-sm">Ensure all sensors have good contact with your skin.</p>
                </div>

                <div className="space-y-6 relative z-10">
                    <div>
                        <div className="text-center text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Temporal (Sides)</div>
                        <div className="grid grid-cols-2 gap-4">
                            {["T3", "T4"].map((ch) => {
                                const status = getSignalStatus((resistances as any)[ch]);
                                return (
                                    <div key={ch} className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center gap-2 transition-all hover:bg-gray-800/80">
                                        <div className={`w-3 h-3 rounded-full ${status.bg} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                                        <div className={`text-xl font-mono font-bold ${status.color}`}>{ch}</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-semibold">{status.label}</div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {(resistances as any)[ch] === Infinity ? "---" : Math.round((resistances as any)[ch] / 1000) + "kΩ"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="text-center text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Occipital (Back)</div>
                        <div className="grid grid-cols-2 gap-4">
                            {["O1", "O2"].map((ch) => {
                                const status = getSignalStatus((resistances as any)[ch]);
                                return (
                                    <div key={ch} className="bg-gray-800/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center gap-2 transition-all hover:bg-gray-800/80">
                                        <div className={`w-3 h-3 rounded-full ${status.bg} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                                        <div className={`text-xl font-mono font-bold ${status.color}`}>{ch}</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-semibold">{status.label}</div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {(resistances as any)[ch] === Infinity ? "---" : Math.round((resistances as any)[ch] / 1000) + "kΩ"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        onClick={onStartSession}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${allGood
                            ? "bg-white text-black hover:bg-gray-200 hover:scale-[1.02]"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                            }`}
                    // Allow override if they really want, or force them to wait? 
                    // Let's allow override for testing but style it as disabled-ish if poor.
                    >
                        {allGood ? "Start Session" : "Adjust Headset to Continue"}
                    </button>
                    {!allGood && (
                        <button onClick={onStartSession} className="w-full text-center text-xs text-gray-600 mt-4 hover:text-gray-400 underline">
                            Skip Check (Not Recommended)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
