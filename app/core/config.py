import os
from typing import List, Optional
from pydantic import BaseSettings, root_validator

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ASSEMBLYAI_API_KEY: str
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    UPLOAD_DIR: str = "uploads"
    CORS_ORIGINS: List[str] = ["*"]
    PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    @root_validator(pre=False)
    def check_google_key(cls, values):
        google_api_key = values.get("GOOGLE_API_KEY")
        gemini_api_key = values.get("GEMINI_API_KEY")
        if not google_api_key and gemini_api_key:
             values["GOOGLE_API_KEY"] = gemini_api_key
        return values

settings = Settings()
