class SensorLogic:
    def __init__(self):
        self.blink_rate_threshold = 15  # Blinks per minute for drowsiness
        self.yawn_recent_threshold = 5  # Seconds to consider recent yawn

    def determine_state(self, metrics):
        """Determine driver state based on metrics."""
        blink_rate = metrics.get("blink_rate", 0)
        yawn_detected = metrics.get("yawn_detected", False)
        
        if blink_rate > self.blink_rate_threshold or yawn_detected:
            return "Drowsy"
        return "Awake"