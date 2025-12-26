let eyesClosedPercent = 0;
let isYawning = false;
let acceleratorActive = false;
let brakeActive = false;
let seatbeltNormal = true;
let alertCounter = 2;
let alarmPlaying = false;

// Initialize webcam (existing logic)
async function initWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: 1280, height: 720 } 
        });
        const video = document.getElementById('webcam');
        video.srcObject = stream;
        video.play();
    } catch (err) {
        console.error("Error accessing webcam:", err);
    }
}

// Function to play alarm
function playAlarm() {
    if (!alarmPlaying) {
        alarmPlaying = true;
        const audio = new Audio('assets/alarm/alarm1.wav');
        audio.play();
        audio.onended = () => {
            alarmPlaying = false; // allow future alarms
        };
    }
}

// Reset system
function resetSystem() {
    eyesClosedPercent = 0;
    isYawning = false;
    acceleratorActive = false;
    brakeActive = false;
    seatbeltNormal = true;
    alertCounter = 2;
}

// Main drowsiness check
function checkDrowsiness() {
    // Example suspicious condition
    const suspiciousCondition = eyesClosedPercent > 70 && isYawning && !seatbeltNormal;

    if (suspiciousCondition) {
        playAlarm();
    }
}

// Key listener for reset
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase();
    if (key === 'S' || key === 'A') {
        resetSystem();
    }
});

// Simulated sensor updates (replace with real data)
function updateSensors(eyes, yawning, accel, brake, seatbelt) {
    eyesClosedPercent = eyes;
    isYawning = yawning;
    acceleratorActive = accel;
    brakeActive = brake;
    seatbeltNormal = seatbelt;

    checkDrowsiness();
}

// Start webcam on load
window.onload = () => {
    initWebcam();
};
