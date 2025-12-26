// Add these at the top with other state variables
let spacebarHoldStart = 0;
let spacebarHolding = false;
let spacebarProgress = 0;

// Add these function definitions after the state variables section:

// ------------------ Keyboard Controls ------------------
function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    
    switch(key) {
        case 'a':
            // Activate accelerator
            acceleratorActive = true;
            brakeActive = false;
            console.log('[CONTROL] Accelerator pressed');
            sendSensorUpdate('accelerator', true);
            updateVehicleControlsUI();
            break;
            
        case 'b':
            // Activate brake
            brakeActive = true;
            acceleratorActive = false;
            console.log('[CONTROL] Brake pressed');
            sendSensorUpdate('brake', true);
            updateVehicleControlsUI();
            break;
            
        case ' ':
            // Spacebar - emergency/seatbelt
            if (!spacebarHolding) {
                spacebarHoldStart = Date.now();
                spacebarHolding = true;
                spacebarProgress = 0;
                
                // Start visual feedback
                startSpacebarProgress();
                
                console.log('[CONTROL] Spacebar hold started');
            }
            event.preventDefault(); // Prevent page scrolling
            break;
    }
}

function handleKeyUp(event) {
    const key = event.key.toLowerCase();
    
    switch(key) {
        case 'a':
            // Deactivate accelerator after delay
            setTimeout(() => {
                acceleratorActive = false;
                updateVehicleControlsUI();
                sendSensorUpdate('accelerator', false);
            }, 3000); // Simulate 3-second delay
            break;
            
        case 'b':
            // Deactivate brake after delay
            setTimeout(() => {
                brakeActive = false;
                updateVehicleControlsUI();
                sendSensorUpdate('brake', false);
            }, 3000); // Simulate 3-second delay
            break;
            
        case ' ':
            // Spacebar released
            if (spacebarHolding) {
                const holdDuration = Date.now() - spacebarHoldStart;
                
                // Check if held for at least 5 seconds (changed from 2)
                if (holdDuration >= 5000) {
                    // Trigger seatbelt tension spike
                    seatbeltNormal = false;
                    console.log('[EMERGENCY] Seatbelt tension spike triggered!');
                    sendSensorUpdate('seatbelt', true);
                    
                    // Send high-risk alert
                    sendEmergencyAlert('HIGH_RISK');
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        seatbeltNormal = true;
                        updateVehicleControlsUI();
                        sendSensorUpdate('seatbelt', false);
                    }, 2000);
                }
                
                spacebarHolding = false;
                spacebarProgress = 0;
                updateSpacebarProgressUI();
            }
            event.preventDefault();
            break;
    }
}

// ------------------ Visual Feedback Functions ------------------
function startSpacebarProgress() {
    const interval = setInterval(() => {
        if (!spacebarHolding) {
            clearInterval(interval);
            return;
        }
        
        const currentTime = Date.now();
        const elapsed = currentTime - spacebarHoldStart;
        spacebarProgress = Math.min((elapsed / 5000) * 100, 100); // 5 seconds = 100%
        
        updateSpacebarProgressUI();
        
        // If reached 100%, trigger immediately
        if (spacebarProgress >= 100) {
            // Trigger seatbelt tension
            seatbeltNormal = false;
            sendSensorUpdate('seatbelt', true);
            sendEmergencyAlert('HIGH_RISK');
            
            // Reset
            setTimeout(() => {
                seatbeltNormal = true;
                sendSensorUpdate('seatbelt', false);
                spacebarHolding = false;
                updateVehicleControlsUI();
                updateSpacebarProgressUI();
            }, 2000);
            
            clearInterval(interval);
        }
    }, 50);
}

function updateSpacebarProgressUI() {
    const progressElement = document.getElementById('spacebar-progress');
    const progressText = document.getElementById('spacebar-text');
    
    if (progressElement) {
        progressElement.style.width = `${spacebarProgress}%`;
        progressElement.style.backgroundColor = spacebarProgress < 100 ? '#4285f4' : 'red';
    }
    
    if (progressText) {
        if (spacebarHolding) {
            const remaining = Math.ceil((5000 - (Date.now() - spacebarHoldStart)) / 1000);
            progressText.textContent = remaining > 0 ? 
                `Hold Spacebar for ${remaining}s...` : 
                'Emergency triggered!';
        } else {
            progressText.textContent = 'Hold Spacebar (5s) for emergency';
        }
    }
}

function updateVehicleControlsUI() {
    // Update accelerator display
    const acceleratorElement = document.getElementById('accelerator-status');
    if (acceleratorElement) {
        acceleratorElement.textContent = acceleratorActive ? 'Active' : 'Inactive';
        acceleratorElement.style.color = acceleratorActive ? 'green' : '#666';
    }
    
    // Update brake display
    const brakeElement = document.getElementById('brake-status');
    if (brakeElement) {
        brakeElement.textContent = brakeActive ? 'Active' : 'Inactive';
        brakeElement.style.color = brakeActive ? 'red' : '#666';
    }
    
    // Update seatbelt display
    const seatbeltElement = document.getElementById('seatbelt-status');
    if (seatbeltElement) {
        seatbeltElement.textContent = seatbeltNormal ? 'Normal' : 'Tension Spike';
        seatbeltElement.style.color = seatbeltNormal ? 'green' : 'red';
    }
}

function sendEmergencyAlert(status) {
    console.log(`[EMERGENCY ALERT] Status: ${status}`);
    
    // Simulate sending to backend
    fetch('/api/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status })
    }).catch(err => {
        console.error('Failed to send alert:', err);
    });
    
    // Update UI
    const alertElement = document.getElementById('emergency-alert');
    if (alertElement) {
        alertElement.style.display = 'block';
        alertElement.textContent = `EMERGENCY: ${status} detected!`;
        
        // Hide after 5 seconds
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}

// ------------------ Initialize ------------------
window.addEventListener('DOMContentLoaded', () => {
    initWebcam();
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // Initialize UI
    updateVehicleControlsUI();
    updateSpacebarProgressUI();
});

// Also update the HOLD_DURATION constant (increase to 5 seconds):
const HOLD_DURATION = 5000; // Changed from 2000 to 5000 (5 seconds)