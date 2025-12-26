from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
from mediapipe_processor import MediaPipeProcessor
from sensor_logic import SensorLogic
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Initialize components
cap = cv2.VideoCapture(0)  # Access webcam (default camera)
processor = MediaPipeProcessor()
sensor_logic = SensorLogic()

# Shared data for drowsiness metrics (thread-safe with locks if needed, but simple for demo)
drowsiness_data = {
    "ear": 0.0,
    "blink_rate": 0,
    "yawn_detected": False,
    "driver_state": "Awake"
}

def generate_frames():
    """Generate MJPEG frames from webcam for streaming."""
    while True:
        success, frame = cap.read()
        if not success:
            break
        # Process frame with MediaPipe
        processed_frame, metrics = processor.process_frame(frame)
        # Update shared drowsiness data
        drowsiness_data.update(metrics)
        drowsiness_data["driver_state"] = sensor_logic.determine_state(metrics)
        
        # Encode frame as JPEG
        ret, buffer = cv2.imencode('.jpg', processed_frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    """Endpoint for MJPEG video stream."""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/drowsiness_data')
def get_drowsiness_data():
    """Endpoint to return drowsiness metrics as JSON."""
    return jsonify(drowsiness_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)