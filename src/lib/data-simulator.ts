
// Protocol Stages mimicking the 7-minute session
// Phase 1: High Beta (active/stressed) -> moving to Theta
// Phase 2: High Alpha (relaxed)
// Phase 3: High Gamma (flow)

export function generateSimulatedBrainwaves(timeLeft: number, phase: 'Calibration' | 'Alpha Induction' | 'Gamma Flow') {
    const elapsed = 420 - timeLeft;
    const t = Date.now() / 1000;

    let targetAlpha = 10;
    let targetBeta = 10;
    let targetTheta = 10;
    let targetGamma = 10;

    // Simulate "Progress" through the stages
    if (phase === 'Calibration') {
        // High Beta initially, calming down
        targetBeta = 30 + Math.sin(t) * 5;
        targetAlpha = 15 + Math.sin(t * 0.5) * 2;
        targetTheta = 10;
        targetGamma = 5;
    } else if (phase === 'Alpha Induction') {
        // Alpha dominance
        targetBeta = 10;
        targetAlpha = 40 + Math.sin(t * 0.2) * 10; // Swelling alpha
        targetTheta = 20;
        targetGamma = 10;
    } else if (phase === 'Gamma Flow') {
        // Gamma dominance + Alpha support
        targetBeta = 15;
        targetAlpha = 20;
        targetTheta = 10;
        targetGamma = 35 + Math.sin(t * 3) * 10; // Fast gamma ripples
    }

    // Add some noise
    const noise = () => (Math.random() - 0.5) * 5;

    return {
        alpha: Math.max(1, targetAlpha + noise()),
        beta: Math.max(1, targetBeta + noise()),
        theta: Math.max(1, targetTheta + noise()),
        gamma: Math.max(1, targetGamma + noise())
    };
}
