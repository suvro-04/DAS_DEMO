from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import time
from mediapipe_processor import DriverMonitor
from sensor_logic import SensorSimulator

app = Flask(__name__)
CORS(app)

monitor = DriverMonitor()
sensors = SensorSimulator()

# Global state
driver_status = {
    'status': 'NORMAL',
    'last_update': time.time()
}
alert_history = []


@app.route('/api/analyze-frame', methods=['POST'])
def analyze_frame():
    data = request.get_json(silent=True)
    if not data or 'frame' not in data:
        return jsonify({'error': 'No frame provided'}), 400

    try:
        frame_data = base64.b64decode(data['frame'].split(',')[1])
        np_arr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception:
        return jsonify({'error': 'Invalid frame data'}), 400

    metrics = monitor.analyze_frame(frame)
    return jsonify(metrics)


@app.route('/api/driver-status', methods=['GET'])
def get_driver_status():
    sensor_data = sensors.get_status()

    eyes_closed = request.args.get('eyes_closed', default=0.0, type=float)
    yawning = request.args.get('yawning', default='false').lower() == 'true'
    head_tilt_excessive = request.args.get(
        'head_tilt_excessive', default='false'
    ).lower() == 'true'

    if sensor_data['seatbelt_tension_spike']:
        driver_status['status'] = 'HIGH_RISK'
        send_alert('HIGH_RISK')

    elif sensor_data['vehicle_in_motion'] and not sensor_data['brake_active']:
        if eyes_closed > 2 or yawning or head_tilt_excessive:
            if not sensor_data['accelerator_active']:
                driver_status['status'] = 'DROWSY'
                send_alert('DROWSY')
        else:
            driver_status['status'] = 'NORMAL'
    else:
        driver_status['status'] = 'NORMAL'

    driver_status['last_update'] = time.time()

    return jsonify({
        **driver_status,
        **sensor_data
    })


@app.route('/api/update-sensors', methods=['POST'])
def update_sensors():
    data = request.get_json(silent=True) or {}
    sensor_type = data.get('sensor')

    if sensor_type in ('accelerator', 'brake', 'seatbelt'):
        sensors.update_sensor(sensor_type)

    return jsonify({'success': True})


@app.route('/api/send-alert', methods=['POST'])
def send_alert_endpoint():
    data = request.get_json(silent=True) or {}
    status = data.get('status', 'UNKNOWN')
    send_alert(status)
    return jsonify({'alert_sent': True})


def send_alert(status):
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')

    location = {
        'lat': 37.7749,
        'lng': -122.4194
    }
    address = 'Simulated Address, San Francisco, CA'

    message = f"""
EMERGENCY ALERT: Driver Drowsiness Detection System
Status: {status}
Time: {timestamp}
Location: {location['lat']}, {location['lng']}
Address: {address}
Vehicle: DEMO-VEHICLE-001
"""

    print("SIMULATED SMS ALERT:")
    print(message)

    alert_history.append({
        'status': status,
        'timestamp': timestamp,
        'location': location,
        'address': address
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
