/**
 * Strict Android Haptics Utility
 * Based on user specifications.
 * 
 * Rules:
 * 1. Only Android (Regex check)
 * 2. navigator.vibrate must exist
 * 3. Fail silently
 */

// Debug Logs (Temporary)
const logHapticDebug = (msg) => {
    // Uncomment to debug in production console if needed
    console.log(`[Haptics] ${msg}`, {
        isAndroid: /Android/i.test(navigator.userAgent),
        hasVibrate: !!navigator.vibrate
    });
};

const vibrateAndroid = (pattern) => {
    try {
        const ua = navigator.userAgent;
        // Strict check: Must be Android, NOT Windows Phone
        const isAndroid = /Android/i.test(ua) && !/Windows Phone/i.test(ua);

        if (isAndroid && typeof navigator.vibrate === 'function') {
            // Ensure pattern is valid for Android (some prefer array)
            const safePattern = Array.isArray(pattern) ? pattern : [pattern];
            navigator.vibrate(safePattern);
            logHapticDebug(`Vibrated: ${safePattern}`);
        } else {
            logHapticDebug(`Skipped. Android: ${isAndroid}`);
        }
    } catch (e) {
        // Fail silently
        console.error("Vibration error", e);
    }
};

const haptics = {
    // Tap -> 10ms
    light: () => {
        vibrateAndroid(10);
    },

    // Select -> 40ms (Medium)
    medium: () => {
        vibrateAndroid(40);
    },

    // Ticket Created (Heavy) -> [20, 30, 20]
    heavy: () => {
        vibrateAndroid([20, 30, 20]);
    },

    // Success -> [20, 30, 20] (User requested [20, 30, 20] for ticket, reusing similar for success or as requested)
    // User requested Success: [20, 30, 20] in rule 6? No, "Success [20, 30, 20]".
    // Wait, let's look at the prompt rule 6:
    // Success [20, 30, 20]
    // Error 50
    // SOS [80, 40, 80]

    success: () => {
        vibrateAndroid([20, 30, 20]);
    },

    error: () => {
        vibrateAndroid(50);
    },

    // SOS / Warning
    warning: () => {
        vibrateAndroid([80, 40, 80]);
    },

    // Selection (optional hook)
    selection: () => {
        vibrateAndroid(40); // Mapped to Medium -> 40
    }
};

export default haptics;
