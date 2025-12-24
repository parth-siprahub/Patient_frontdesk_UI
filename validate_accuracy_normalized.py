import asyncio
import os
import shutil
import difflib
import re
import string
from sqlmodel import Session, select, create_engine, SQLModel
from app.models.base import Consultation, AudioFile, SOAPNote
from app.services.consultation_processor import process_consultation_flow

# Reuse the DB from previous test to save time if possible, or just re-run flow
# But since we deleted the DB, let's just re-implement the similarity logic 
# and read the files directly for this demonstration if we can, 
# BUT we need to generate the transcript first. 
# So let's revert to the full flow but adding normalization.

from app.models.base import Consultation, AudioFile, PatientProfile, User, SOAPNote, ConsultationStatus, AudioUploaderType, UserRole, Appointment, AppointmentStatus
from uuid import uuid4
from datetime import datetime
from app.core.config import settings

DATABASE_URL = "sqlite:///test_accuracy_norm.db"
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)

def normalize_text(text):
    # Lowercase
    text = text.lower()
    # Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Replace digits with placeholder or words (simple approach: remove custom formatting)
    # Actually, let's just ignore extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def calculate_similarity(text1, text2):
    return difflib.SequenceMatcher(None, text1, text2).ratio()

async def main():
    target_audio = "3-audio.aac"
    ground_truth_file = "3-text-ai.txt"
    
    if not os.path.exists(target_audio):
        print("Audio not found.")
        return

    with open(ground_truth_file, "r") as f:
        ground_truth_raw = f.read().strip()

    # Setup Upload
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid4()}.aac"
    dest_path = os.path.join(upload_dir, filename)
    shutil.copy(target_audio, dest_path)
    
    with Session(engine) as session:
        # Create Dummy Data
        user = User(email="accuracy_test_norm@example.com", password_hash="pw", is_active=True, role=UserRole.DOCTOR)
        session.add(user)
        session.commit()
        session.refresh(user)
        
        patient = PatientProfile(user_id=user.id, first_name="Test", last_name="Norm", date_of_birth=datetime.fromisoformat("1967-01-01"), gender="Male")
        session.add(patient)
        
        appointment = Appointment(patient_id=user.id, doctor_id=user.id, scheduled_at=datetime.fromisoformat("2025-01-01T10:00:00"))
        session.add(appointment)
        session.commit()
        session.refresh(appointment)

        consultation = Consultation(
            doctor_id=user.id, patient_id=user.id, status=ConsultationStatus.SCHEDULED, appointment_id=appointment.id
        )
        session.add(consultation)
        session.commit()
        
        audio_file = AudioFile(consultation_id=consultation.id, file_url=dest_path, uploaded_by=AudioUploaderType.DOCTOR, file_name=filename)
        session.add(audio_file)
        session.commit()
        cid = consultation.id

    print("Running AI Flow...")
    try:
        await process_consultation_flow(cid)
    except Exception as e:
        print(f"Error: {e}")
        return

    with Session(engine) as session:
        audio = session.exec(select(AudioFile).where(AudioFile.consultation_id == cid)).first()
        generated_text = audio.transcription.strip()
        
        soap = session.exec(select(SOAPNote).where(SOAPNote.consultation_id == cid)).first()
        
        print(f"\n--- NORMALIZED COMPARISON ---")
        norm_gt = normalize_text(ground_truth_raw)
        norm_gen = normalize_text(generated_text)
        
        similarity = calculate_similarity(norm_gt, norm_gen)
        print(f"Original Score: {calculate_similarity(ground_truth_raw, generated_text):.2%}")
        print(f"Normalized Score: {similarity:.2%}")
        
        if soap:
            print("\n--- LLM CHECK ---")
            print(f"Patient Age in Transcript: {'58' in generated_text or 'fifty-eight' in generated_text}")
            print(f"SOAP Note Content (Snippet):\n{str(soap.soap_json)[:200]}...")

if __name__ == "__main__":
    asyncio.run(main())
