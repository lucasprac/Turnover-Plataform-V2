
class TrainingManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TrainingManager, cls).__new__(cls)
            cls._instance.is_training = False
            cls._instance.progress = 0
            cls._instance.message = "Idle"
            cls._instance.status = "idle" # idle, running, success, error
        return cls._instance

    def start_training(self):
        self.is_training = True
        self.progress = 0
        self.message = "Starting..."
        self.status = "running"

    def update_progress(self, progress: int, message: str):
        self.progress = progress
        self.message = message
        print(f"Training Progress: {progress}% - {message}")

    def complete_training(self):
        self.is_training = False
        self.progress = 100
        self.message = "Training complete."
        self.status = "success"

    def fail_training(self, error: str):
        self.is_training = False
        self.progress = 0
        self.message = f"Failed: {error}"
        self.status = "error"
        print(f"Training Failed: {error}")

training_manager = TrainingManager()
