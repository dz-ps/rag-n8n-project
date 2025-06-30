from pydantic import BaseSettings
import os

class Settings(BaseSettings):
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    google_drive_folder_id: str = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
    slack_webhook_url: str = os.getenv("SLACK_WEBHOOK_URL", "")
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    return Settings()
