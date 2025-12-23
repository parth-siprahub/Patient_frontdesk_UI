import pytest
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

@pytest.fixture(scope="session", autouse=True)
def check_environment():
    """
    Validates that necessary API keys are present in the environment
    before running any live tests.
    """
    assemblyai_key = os.getenv("ASSEMBLYAI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    
    missing_keys = []
    if not assemblyai_key:
        missing_keys.append("ASSEMBLYAI_API_KEY")
    if not google_key:
        missing_keys.append("GOOGLE_API_KEY")
        
    if missing_keys:
        pytest.fail(f"Missing required environment variables for Live Tests: {', '.join(missing_keys)}. Please ensure they are set in your .env file.")

from fastapi.testclient import TestClient
from sqlmodel import SQLModel
from app.main import app
from app.core.db import engine
# Import models to ensure they are registered with SQLModel.metadata
from app.models.base import User, PatientProfile, DoctorProfile, Appointment, Consultation, AudioFile, SOAPNote

@pytest.fixture(scope="session", autouse=True)
def init_db():
    SQLModel.metadata.create_all(engine)
    yield
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(scope="session")
def client(init_db):
    with TestClient(app) as c:
        yield c
