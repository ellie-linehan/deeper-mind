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

                <div className="relative flex justify-center py-4">
                    {/* Head Map SVG */}
                    <div className="relative w-64 h-64">
                        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
                            <defs>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Head Outline (Top View) */}
                            <path
                                d="M100 20 C 150 20, 180 60, 180 110 C 180 180, 150 210, 100 210 C 50 210, 20 180, 20 110 C 20 60, 50 20, 100 20 Z"
                                fill="none"
                                stroke="#374151"
                                strokeWidth="3"
                            />
                            {/* Nose */}
                            <path d="M90 20 L 100 5 L 110 20" fill="none" stroke="#374151" strokeWidth="3" />
                            {/* Ears */}
                            <path d="M20 90 Q 5 110 20 130" fill="none" stroke="#374151" strokeWidth="3" />
                            <path d="M180 90 Q 195 110 180 130" fill="none" stroke="#374151" strokeWidth="3" />

                            {/* Connection Lines (Brainbit Flex Shape roughly) */}
                            <path d="M35 100 C 35 100, 100 80, 165 100" fill="none" stroke="#4b5563" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                            <path d="M35 100 C 35 160, 60 190, 100 190 C 140 190, 165 160, 165 100" fill="none" stroke="#4b5563" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

                            {/* Electrodes */}
                            {[{ id: 'T3', x: 35, y: 100 }, { id: 'T4', x: 165, y: 100 }, { id: 'O1', x: 70, y: 180 }, { id: 'O2', x: 130, y: 180 }].map((node) => {
                                const status = getSignalStatus((resistances as any)[node.id]);
                                return (
                                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                        {/* Outer ring */}
                                        <circle r="12" className={`${status.color} opacity-20`} fill="currentColor" />
                                        <circle r="12" className={status.color} stroke="currentColor" strokeWidth="2" fill="none" />

                                        {/* Inner glow dot */}
                                        <circle r="5" className={status.color} fill="currentColor" filter="url(#glow)" />

                                        {/* Label */}
                                        <text y="28" x="0" textAnchor="middle" className="fill-white text-[12px] font-bold tracking-widest drop-shadow-md">{node.id}</text>

                                        {/* Value */}
                                        <text y="42" x="0" textAnchor="middle" fill="currentColor" className={`text-[10px] font-mono ${status.color} font-bold drop-shadow-md`}>
                                            {(resistances as any)[node.id] === Infinity ? "---" : Math.round((resistances as any)[node.id] / 1000) + "k"}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
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
                        <button onClick={onStartSession} className="w-full text-center text-xs text-gray-400 mt-4 hover:text-white underline">
                            Skip Check (Not Recommended)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
