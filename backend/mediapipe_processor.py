import cv2
import mediapipe as mp
import numpy as np
import time

class MediaPipeProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
        self.mp_drawing = mp.solutions.drawing_utils
        
        # Blink tracking
        self.blink_counter = 0
        self.blink_start_time = time.time()
        self.ear_threshold = 0.2  # Threshold for blink detection
        self.blink_frames = 0  # Consecutive frames below threshold
        
        # Yawn tracking
        self.yawn_threshold = 0.5  # Normalized distance for mouth opening
        self.yawn_detected = False
        self.yawn_timer = time.time()
        
        # Frame count for blink rate (assuming ~30 FPS)
        self.frame_count = 0

    def calculate_ear(self, eye_landmarks):
        """Calculate Eye Aspect Ratio (EAR) for an eye."""
        # Vertical distances
        v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        # Horizontal distance
        h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        return (v1 + v2) / (2.0 * h)

    def detect_yawn(self, landmarks):
        """Detect yawn based on mouth opening."""
        upper_lip = landmarks[13]  # Upper lip landmark
        lower_lip = landmarks[14]  # Lower lip landmark
        distance = np.linalg.norm(upper_lip - lower_lip)
        return distance > self.yawn_threshold

    def process_frame(self, frame):
        """Process a frame with MediaPipe and return annotated frame + metrics."""
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        ear = 0.0
        blink_rate = 0
        yawn_detected = False
        
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                landmarks = np.array([(lm.x, lm.y) for lm in face_landmarks.landmark])
                
                # Calculate EAR for both eyes
                left_eye = landmarks[33:42]  # Left eye landmarks
                right_eye = landmarks[263:272]  # Right eye landmarks
                left_ear = self.calculate_ear(left_eye)
                right_ear = self.calculate_ear(right_eye)
                ear = (left_ear + right_ear) / 2.0
                
                # Blink detection
                if ear < self.ear_threshold:
                    self.blink_frames += 1
                    if self.blink_frames >= 2:  # Consecutive frames
                        self.blink_counter += 1
                        self.blink_frames = 0
                else:
                    self.blink_frames = 0
                
                # Yawn detection
                if self.detect_yawn(landmarks):
                    yawn_detected = True
                    self.yawn_timer = time.time()
                elif time.time() - self.yawn_timer > 5:  # Reset after 5 seconds
                    yawn_detected = False
                
                # Draw landmarks on frame
                self.mp_drawing.draw_landmarks(frame, face_landmarks, self.mp_face_mesh.FACEMESH_CONTOURS)
        
        # Calculate blink rate per minute
        elapsed_time = time.time() - self.blink_start_time
        if elapsed_time >= 60:
            blink_rate = self.blink_counter
            self.blink_counter = 0
            self.blink_start_time = time.time()
        
        self.frame_count += 1
        
        metrics = {
            "ear": round(ear, 2),
            "blink_rate": blink_rate,
            "yawn_detected": yawn_detected
        }
        return frame, metrics