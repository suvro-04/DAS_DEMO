// ===============================
// POLLING DROWSINESS DATA
// ===============================
setInterval(() => {
    fetch('http://localhost:5000/drowsiness_data')
        .then(res => res.json())
        .then(data => {
            document.getElementById('ear').textContent = data.ear;
            document.getElementById('blink-rate').textContent = data.blink_rate;
            document.getElementById('yawn').textContent = data.yawn_detected ? 'Yes' : 'No';

            const stateEl = document.getElementById('state');
            stateEl.textContent = data.driver_state;
            stateEl.className = data.driver_state === 'Drowsy' ? 'drowsy' : '';
        })
        .catch(err => console.error('Fetch error:', err));
}, 1000);

// ===============================
// KEYBOARD SENSOR LOGIC
// ===============================
let acceleratorActive = false;
let brakeActive = false;

let seatbeltTimer = null;
let seatbeltSuspicious = false;

// ---------- KEY DOWN ----------
document.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    // Accelerator
    if (e.key.toLowerCase() === 'a') {
        acceleratorActive = true;
        setStatus('accelerator', 'Active', 'active');
    }

    // Brake
    if (e.key.toLowerCase() === 'b') {
        brakeActive = true;
        setStatus('brake', 'Active', 'active');
    }

    // Seatbelt pressure
    if (e.code === 'Space' && !seatbeltTimer) {
        e.preventDefault();

        seatbeltTimer = setTimeout(() => {

            // CASE 1: Brake pressed → Normal behavior
            if (brakeActive) {
                seatbeltSuspicious = false;
                setStatus('seatbelt', 'Normal (Brake)', 'normal');
            }
            // CASE 2: No pedals → Suspicious
            else if (!acceleratorActive && !brakeActive) {
                seatbeltSuspicious = true;
                setStatus('seatbelt', 'Suspicious Pressure', 'warning');
            }
            // CASE 3: Accelerator active
            else {
                seatbeltSuspicious = false;
                setStatus('seatbelt', 'Normal', 'normal');
            }

            // Send seatbelt context to backend
            sendSeatbeltStatus();

        }, 5000);
    }
});

// ---------- KEY UP ----------
document.addEventListener('keyup', (e) => {

    if (e.key.toLowerCase() === 'a') {
        acceleratorActive = false;
        setStatus('accelerator', 'Inactive', '');
    }

    if (e.key.toLowerCase() === 'b') {
        brakeActive = false;
        setStatus('brake', 'Inactive', '');
    }

    if (e.code === 'Space') {
        clearTimeout(seatbeltTimer);
        seatbeltTimer = null;

        if (!seatbeltSuspicious) {
            setStatus('seatbelt', 'Improper / Released', 'improper');
        }
    }
});

// ===============================
// SEND SEATBELT DATA TO BACKEND
// ===============================
function sendSeatbeltStatus() {
    fetch('http://localhost:5000/drowsiness_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            seatbelt_suspicious: seatbeltSuspicious
        })
    }).catch(err => console.error('Seatbelt POST error:', err));
}

// ===============================
// UI HELPER
// ===============================
function setStatus(id, text, cls) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = cls;
}

// ===============================
// GEOLOCATION (UNCHANGED)
// ===============================
let map, marker;

function initMap(lat, lng) {
    const loc = { lat, lng };
    map = new google.maps.Map(document.getElementById('map'), {
        center: loc,
        zoom: 15
    });
    marker = new google.maps.Marker({ position: loc, map });
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById('coords').textContent =
                `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            if (!map) initMap(lat, lng);
            else {
                marker.setPosition({ lat, lng });
                map.setCenter({ lat, lng });
            }
        },
        err => console.error('Geolocation error:', err),
        { enableHighAccuracy: true }
    );
}
