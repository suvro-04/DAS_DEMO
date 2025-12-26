// ------------------ State Variables ------------------
let eyesClosedPercent = 0;
let isYawning = false;
let headPitch = 0;
let headYaw = 0;
let acceleratorActive = false;
let brakeActive = false;
let seatbeltNormal = true;
let seatbeltHoldTimeout = null;
let drowsinessCounter = 0;
let highRiskAlertSent = false;

// ------------------ Debounce & Constants ------------------
let lastUpdate = 0;
const debounceMs = 200;
const HOLD_DURATION = 2000; // 2 seconds for spacebar hold

// ------------------ Emergency Contacts ------------------
const emergencyContacts = [
    { name: "Emergency Services", phone: "911", type: "emergency" },
    { name: "Family Member 1", phone: "+1-555-0123", type: "family" },
    { name: "Medical Contact", phone: "+1-555-0124", type: "medical" },
    { name: "Roadside Assistance", phone: "+1-555-0125", type: "assistance" }
];

// ------------------ Vehicle Location ------------------
let currentLocation = {
    lat: 37.7749,
    lng: -122.4194,
    address: "San Francisco, CA, USA"
};

// ------------------ Backend Simulation ------------------
async function sendSensorUpdate(sensor, value) {
    const now = Date.now();
    if (now - lastUpdate < debounceMs) return;
    lastUpdate = now;

    try {
        console.log('[API] Sensor update:', { sensor, value, timestamp: now });
        // Simulate a backend API call
        // await fetch('/api/update-sensors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ sensor, value, timestamp: now }) });
    } catch (err) {
        console.error('Failed to send sensor update:', err);
    }
}

// ------------------ Webcam Initialization ------------------
async function initWebcam() {
    const webcamContainer = document.querySelector('.webcam-container');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        let videoElement = document.getElementById('webcam');
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = 'webcam';
            videoElement.autoplay = true;
            videoElement.muted = true;
            videoElement.playsInline = true;
            if (webcamContainer) webcamContainer.appendChild(videoElement);
        }

        videoElement.srcObject = stream;

        simulateMediaPipeProcessing();

    } catch (err) {
        console.error('Webcam access denied:', err);
        if (webcamContainer) {
            webcamContainer.innerHTML = `
                <div style="padding: 80px 40px; text-align: center; color: #666; background: #f5f5f5; border-radius: 8px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📹</div>
                    <div style="font-size: 16px; margin-bottom: 8px; font-weight: 500;">Camera Access Required</div>
                    <div style="font-size: 13px;">Please allow camera access to enable live monitoring</div>
                    <button onclick="initWebcam()" style="margin-top: 20px; padding: 10px 20px; background: #4285f4; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry Camera Access
                    </button>
                </div>`;
        }
    }
}

// ------------------ Simulate MediaPipe Processing ------------------
function simulateMediaPipeProcessing() {
    setInterval(() => {
        // Randomly simulate driver metrics
        eyesClosedPercent = parseFloat((Math.random() * 15).toFixed(1));
        isYawning = Math.random() > 0.95;
        headPitch = parseFloat((Math.random() * 15 - 7.5).toFixed(1));
        headYaw = parseFloat((Math.random() * 20 - 10).toFixed(1));

        updateMetricsUI();
        checkDriverStatus();

    }, 1000);
}

// ------------------ Update Metrics UI ------------------
function updateMetricsUI() {
    const eyesElement = document.getElementById('eyes-closed');
    if (eyesElement) {
        eyesElement.textContent = `${eyesClosedPercent.toFixed(1)}%`;
        if (eyesClosedPercent > 10) eyesElement.style.color = 'red';
        else if (eyesClosedPercent > 5) eyesElement.style.color = 'orange';
        else eyesElement.style.color = 'green';
    }

    const yawningElement = document.getElementById('yawning');
    if (yawningElement) {
        yawningElement.textContent = isYawning ? 'Yes' : 'No';
        yawningElement.style.color = isYawning ? 'red' : 'green';
    }

    const headTiltElement = document.getElementById('head-tilt');
    if (headTiltElement) {
        headTiltElement.textContent = `P: ${headPitch}° • Y: ${headYaw}°`;
        const maxTilt = Math.max(Math.abs(headPitch), Math.abs(headYaw));
        if (maxTilt > 8) headTiltElement.style.color = 'red';
        else if (maxTilt > 4) headTiltElement.style.color = 'orange';
        else headTiltElement.style.color = 'green';
    }
}

// ------------------ Check Driver Status ------------------
function checkDriverStatus() {
    const driverStatusElement = document.getElementById('driver-status');
    if (!driverStatusElement) return;

    const statusIcon = driverStatusElement.querySelector('.status-icon');
    const statusText = driverStatusElement.querySelector('.status-main');
    const statusSubtext = driverStatusElement.querySelector('.status-sub');

    let status = 'Normal';
    let color = 'green';
    let subtext = 'All systems operational';

    if (eyesClosedPercent > 10 || isYawning || Math.max(Math.abs(headPitch), Math.abs(headYaw)) > 8) {
        drowsinessCounter++;
        status = 'Drowsy';
        color = 'red';
        subtext = 'Driver attention is low!';
        if (!highRiskAlertSent && drowsinessCounter > 3) {
            highRiskAlertSent = true;
            console.warn('[ALERT] High risk drowsiness detected!');
        }
    } else {
        drowsinessCounter = 0;
        highRiskAlertSent = false;
    }

    if (statusIcon) statusIcon.textContent = status === 'Normal' ? '✓' : '⚠️';
    if (statusText) statusText.textContent = status;
    if (statusSubtext) statusSubtext.textContent = subtext;

    driverStatusElement.style.color = color;

    // Send backend update
    sendSensorUpdate('driver-status', status);
}

// ------------------ Initialize ------------------
window.addEventListener('DOMContentLoaded', () => {
    initWebcam();
});
