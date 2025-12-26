// Polling for drowsiness data
setInterval(() => {
    fetch('http://localhost:5000/drowsiness_data')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ear').textContent = data.ear;
            document.getElementById('blink-rate').textContent = data.blink_rate;
            document.getElementById('yawn').textContent = data.yawn_detected ? 'Yes' : 'No';
            const stateEl = document.getElementById('state');
            stateEl.textContent = data.driver_state;
            stateEl.className = data.driver_state === 'Drowsy' ? 'drowsy' : '';
        })
        .catch(error => console.error('Error fetching data:', error));
}, 1000);

// Keyboard sensor simulation
let acceleratorActive = false;
let brakeActive = false;
let seatbeltHeld = false;
let seatbeltTimer = null;

document.addEventListener('keydown', (event) => {
    if (event.key === 'a' || event.key === 'A') {
        acceleratorActive = true;
        document.getElementById('accelerator').textContent = 'Active';
        document.getElementById('accelerator').className = 'active';
    }
    if (event.key === 'b' || event.key === 'B') {
        brakeActive = true;
        document.getElementById('brake').textContent = 'Active';
        document.getElementById('brake').className = 'active';
    }
    if (event.code === 'Space') {
        event.preventDefault();
        if (!seatbeltHeld) {
            seatbeltHeld = true;
            seatbeltTimer = setTimeout(() => {
                document.getElementById('seatbelt').textContent = 'Normal';
                document.getElementById('seatbelt').className = 'normal';
            }, 5000);
        }
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'a' || event.key === 'A') {
        acceleratorActive = false;
        document.getElementById('accelerator').textContent = 'Inactive';
        document.getElementById('accelerator').className = '';
    }
    if (event.key === 'b' || event.key === 'B') {
        brakeActive = false;
        document.getElementById('brake').textContent = 'Inactive';
        document.getElementById('brake').className = '';
    }
    if (event.code === 'Space') {
        seatbeltHeld = false;
        if (seatbeltTimer) {
            clearTimeout(seatbeltTimer);
            seatbeltTimer = null;
        }
        document.getElementById('seatbelt').textContent = 'Improper';
        document.getElementById('seatbelt').className = 'improper';
    }
});

// Geolocation and Google Maps
let map;
let marker;

function initMap(lat, lng) {
    const location = { lat, lng };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: location,
    });
    marker = new google.maps.Marker({
        position: location,
        map: map,
    });
}

if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            document.getElementById('coords').textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            if (!map) {
                initMap(lat, lng);
            } else {
                const newPos = { lat, lng };
                marker.setPosition(newPos);
                map.setCenter(newPos);
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            // Default to NYC for demo
            const lat = 40.7128, lng = -74.0060;
            document.getElementById('coords').textContent = `${lat}, ${lng}`;
            initMap(lat, lng);
        }
    );
} else {
    // Fallback
    const lat = 40.7128, lng = -74.0060;
    document.getElementById('coords').textContent = `${lat}, ${lng}`;
    initMap(lat, lng);
}