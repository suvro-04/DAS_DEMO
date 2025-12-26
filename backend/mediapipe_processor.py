import cv2
import numpy as np
import mediapipe as mp
import math


class DriverMonitor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def analyze_frame(self, frame):
        if frame is None:
            return self._empty_metrics()

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        metrics = self._empty_metrics()

        if not results.multi_face_landmarks:
            return metrics

        metrics['face_detected'] = True
        landmarks = results.multi_face_landmarks[0].landmark

        # Eye Aspect Ratio (EAR)
        left_eye_idx = [33, 160, 158, 133, 153, 144]
        left_eye = [landmarks[i] for i in left_eye_idx]
        ear = self._eye_aspect_ratio(left_eye)

        metrics['eyes_closed'] = float(
            np.clip((1.0 - ear) * 100.0, 0.0, 100.0)
        )

        # Mouth Aspect Ratio (MAR)
        mouth_idx = [61, 291, 39, 181, 0, 17, 269, 405]
        mouth = [landmarks[i] for i in mouth_idx]
        mar = self._mouth_aspect_ratio(mouth)

        metrics['yawning'] = mar > 0.5

        # Head tilt
        metrics['head_tilt'] = self._calculate_head_pose(landmarks)

        return metrics

    def _empty_metrics(self):
        return {
            'face_detected': False,
            'eyes_closed': 0.0,
            'yawning': False,
            'head_tilt': {'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0}
        }

    def _eye_aspect_ratio(self, eye):
        p1 = np.array([eye[1].x, eye[1].y])
        p2 = np.array([eye[5].x, eye[5].y])
        p3 = np.array([eye[2].x, eye[2].y])
        p4 = np.array([eye[4].x, eye[4].y])
        p5 = np.array([eye[0].x, eye[0].y])
        p6 = np.array([eye[3].x, eye[3].y])

        A = np.linalg.norm(p1 - p2)
        B = np.linalg.norm(p3 - p4)
        C = np.linalg.norm(p5 - p6)

        if C == 0:
            return 0.0

        return (A + B) / (2.0 * C)

    def _mouth_aspect_ratio(self, mouth):
        p1 = np.array([mouth[2].x, mouth[2].y])
        p2 = np.array([mouth[6].x, mouth[6].y])
        p3 = np.array([mouth[3].x, mouth[3].y])
        p4 = np.array([mouth[5].x, mouth[5].y])
        p5 = np.array([mouth[0].x, mouth[0].y])
        p6 = np.array([mouth[4].x, mouth[4].y])

        A = np.linalg.norm(p1 - p2)
        B = np.linalg.norm(p3 - p4)
        C = np.linalg.norm(p5 - p6)

        if C == 0:
            return 0.0

        return (A + B) / (2.0 * C)

    def _calculate_head_pose(self, landmarks):
        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]

        dx = right_eye.x - left_eye.x
        dy = left_eye.y - right_eye.y

        yaw = math.degrees(math.atan2(dx, 0.1))
        roll = math.degrees(math.atan2(dy, dx))

        eye_center_y = (left_eye.y + right_eye.y) / 2.0
        pitch = math.degrees(math.atan2(nose.y - eye_center_y, 0.1))

        return {
            'pitch': float(np.clip(pitch, -90.0, 90.0)),
            'yaw': float(np.clip(yaw, -90.0, 90.0)),
            'roll': float(np.clip(roll, -90.0, 90.0))
        }

    def __del__(self):
        if self.face_mesh:
            self.face_mesh.close()
