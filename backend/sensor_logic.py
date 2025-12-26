class SensorLogic:
    def __init__(self):
        # Thresholds (demo-level, configurable)
        self.blink_rate_threshold = 15  # blinks per minute

    def determine_state(self, metrics):
        """
        Decide driver state based on combined signals.
        This is the FINAL decision logic.
        """

        blink_rate = metrics.get("blink_rate", 0)
        yawn_detected = metrics.get("yawn_detected", False)
        seatbelt_suspicious = metrics.get("seatbelt_suspicious", False)

        # Rule 1: Excessive blinking
        if blink_rate > self.blink_rate_threshold:
            return "Drowsy"

        # Rule 2: Recent yawn
        if yawn_detected:
            return "Drowsy"

        # Rule 3: Abnormal seatbelt pressure without pedals
        if seatbelt_suspicious:
            return "Drowsy"

        return "Awake"
