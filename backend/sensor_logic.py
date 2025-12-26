import time

class SensorSimulator:
    def __init__(self):
        self.accelerator_active = False
        self.brake_active = False
        self.seatbelt_tension_spike = False
        self.vehicle_in_motion = True  # Simulated as always true for demo
        self.last_accelerator_time = 0
        self.last_brake_time = 0
        self.last_seatbelt_time = 0
    
    def update_sensor(self, sensor_type):
        current_time = time.time()
        if sensor_type == 'accelerator':
            self.accelerator_active = True
            self.last_accelerator_time = current_time
        elif sensor_type == 'brake':
            self.brake_active = True
            self.last_brake_time = current_time
        elif sensor_type == 'seatbelt':
            self.seatbelt_tension_spike = True
            self.last_seatbelt_time = current_time
    
    def get_status(self):
        current_time = time.time()
        # Auto-reset after 3 seconds
        if current_time - self.last_accelerator_time > 3:
            self.accelerator_active = False
        if current_time - self.last_brake_time > 3:
            self.brake_active = False
        if current_time - self.last_seatbelt_time > 2:
            self.seatbelt_tension_spike = False
        
        return {
            'accelerator_active': self.accelerator_active,
            'brake_active': self.brake_active,
            'seatbelt_tension_spike': self.seatbelt_tension_spike,
            'vehicle_in_motion': self.vehicle_in_motion
        }