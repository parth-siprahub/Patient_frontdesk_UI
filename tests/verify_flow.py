import asyncio
import os
from datetime import datetime
from unittest.mock import MagicMock, patch, AsyncMock # Import AsyncMock
from uuid import uuid4

# Setup dummy env vars BEFORE importing app modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET"] = "test"
os.environ["ASSEMBLYAI_API_KEY"] = "test"
os.environ["GOOGLE_API_KEY"] = "test"

from sqlmodel import Session, create_engine, SQLModel, select
from app.models.base import Consultation, ConsultationStatus, AudioFile, Appointment, User, UserRole, SOAPNote # Added SOAPNote
from app.services.consultation_processor import process_consultation_flow

# Setup In-Memory DB for testing
sqlite_url = "sqlite://"
engine = create_engine(sqlite_url)
SQLModel.metadata.create_all(engine)

@patch("app.services.consultation_processor.engine", engine)
@patch("app.services.consultation_processor.AssemblyAIService")
@patch("app.services.consultation_processor.GeminiService")
async def test_flow(MockGemini, MockAssemblyAI):
    # Setup Mocks to be awaitable
    MockAssemblyAI.transcribe_audio_async = AsyncMock(return_value={
        "text": "Patient has a headache.",
        "utterances": [{"speaker": "A", "text": "Patient has a headache."}],
        "confidence": 0.98
    })
    
    MockGemini.generate_soap_note_async = AsyncMock(return_value={
        "soap_note": {
            "subjective": "Headache",
            "objective": "None",
            "assessment": "Migraine",
            "plan": "Rest"
        },
        "risk_flags": ["None"]
    })
    
    # Setup Data
    consultation_id = uuid4()
    patient_id = uuid4()
    doctor_id = uuid4()
    
    with Session(engine) as session:
        # Create User dependencies
        patient = User(id=patient_id, email="p@test.com", password_hash="pw", role=UserRole.PATIENT)
        doctor = User(id=doctor_id, email="d@test.com", password_hash="pw", role=UserRole.DOCTOR)
        session.add(patient)
        session.add(doctor)
        
        appt = Appointment(
            id=uuid4(), 
            patient_id=patient_id, 
            doctor_id=doctor_id, 
            scheduled_at=datetime(2023, 1, 1, 10, 0, 0)
        )
        session.add(appt)
        
        cons = Consultation(
            id=consultation_id,
            appointment_id=appt.id,
            patient_id=patient_id,
            doctor_id=doctor_id,
            status=ConsultationStatus.SCHEDULED
        )
        session.add(cons)
        
        audio = AudioFile(
            consultation_id=consultation_id,
            uploaded_by="DOCTOR",
            file_name="test.wav",
            file_url="/tmp/test.wav",
            mime_type="audio/wav"
        )
        session.add(audio)
        session.commit()
        
    print("running process_consultation_flow...")
    await process_consultation_flow(consultation_id)
    
    # Verify
    with Session(engine) as session:
        updated_cons = session.get(Consultation, consultation_id)
        print(f"Final Status: {updated_cons.status}")
        
        updated_audio = session.exec(select(AudioFile).where(AudioFile.consultation_id == consultation_id)).first()
        print(f"Transcript: {updated_audio.transcription}")
        
        soap = session.exec(select(SOAPNote).where(SOAPNote.consultation_id == consultation_id)).first()
        print(f"SOAP Note: {soap.soap_json}")
        
        assert updated_cons.status == ConsultationStatus.COMPLETED
        assert updated_audio.transcription == "Patient has a headache."
        assert soap.soap_json["subjective"] == "Headache"
        print("Verification Successful!")

if __name__ == "__main__":
    asyncio.run(test_flow())
