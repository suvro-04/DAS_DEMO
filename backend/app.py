from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2

from mediapipe_processor import MediaPipeProcessor
from sensor_logic import SensorLogic

app = Flask(__name__)
CORS(app)  # Allow frontend access (demo only)

# Initialize webcam and logic
cap = cv2.VideoCapture(0)
processor = MediaPipeProcessor()
sensor_logic = SensorLogic()

# Shared state (simple dict for demo)
drowsiness_data = {
    "ear": 0.0,
    "blink_rate": 0,
    "yawn_detected": False,
    "seatbelt_suspicious": False,
    "driver_state": "Awake"
}

def generate_frames():
    """Generate MJPEG frames from webcam."""
    while True:
        success, frame = cap.read()
        if not success:
            break

        processed_frame, metrics = processor.process_frame(frame)

        # Update metrics from vision
        drowsiness_data["ear"] = metrics.get("ear", 0.0)
        drowsiness_data["blink_rate"] = metrics.get("blink_rate", 0)
        drowsiness_data["yawn_detected"] = metrics.get("yawn_detected", False)

        # FINAL decision happens here
        drowsiness_data["driver_state"] = sensor_logic.determine_state(drowsiness_data)

        ret, buffer = cv2.imencode(".jpg", processed_frame)
        frame_bytes = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )

@app.route("/video_feed")
def video_feed():
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

@app.route("/drowsiness_data", methods=["GET", "POST"])
def get_drowsiness_data():
    """
    GET  -> frontend reads metrics
    POST -> frontend sends seatbelt context
    """
    if request.method == "POST":
        data = request.get_json()
        if data and "seatbelt_suspicious" in data:
            drowsiness_data["seatbelt_suspicious"] = data["seatbelt_suspicious"]

    return jsonify(drowsiness_data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
