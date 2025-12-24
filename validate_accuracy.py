import asyncio
import os
import shutil
import difflib
from datetime import datetime
from sqlmodel import Session, select, create_engine, SQLModel
from app.models.base import Consultation, AudioFile, PatientProfile, User, SOAPNote, ConsultationStatus, AudioUploaderType, UserRole, Appointment, AppointmentStatus
from app.services.consultation_processor import process_consultation_flow
from uuid import uuid4
from app.core.config import settings

# Setup DB
DATABASE_URL = "sqlite:///test_accuracy.db"
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)

def calculate_similarity(text1, text2):
    return difflib.SequenceMatcher(None, text1, text2).ratio()

async def main():
    target_audio = "3-audio.aac"
    ground_truth_file = "3-text-ai.txt"
    
    if not os.path.exists(target_audio):
        print(f"Audio file {target_audio} not found!")
        return
    if not os.path.exists(ground_truth_file):
        print(f"Ground truth file {ground_truth_file} not found!")
        return

    with open(ground_truth_file, "r") as f:
        ground_truth_text = f.read().strip()

    print(f"Processing {target_audio}...")
    
    # Simulate Upload
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid4()}.aac" # Use .aac extension
    dest_path = os.path.join(upload_dir, filename)
    shutil.copy(target_audio, dest_path)
    
    with Session(engine) as session:
        # Create Dummy User & Patient
        user = User(email="accuracy_test@example.com", password_hash="pw", is_active=True, role=UserRole.DOCTOR)
        session.add(user)
        session.commit()
        session.refresh(user)
        
        patient = PatientProfile(
            user_id=user.id, 
            first_name="Validation", 
            last_name="Patient", 
            date_of_birth=datetime.fromisoformat("1965-01-01"), 
            gender="Male",
            city="Test City",
            state="TS"
        )
        session.add(patient)
        
        # Create Appointment
        appointment = Appointment(
             patient_id=user.id,
             doctor_id=user.id,
             scheduled_at=datetime.fromisoformat("2025-01-01T10:00:00"),
             status=AppointmentStatus.SCHEDULED
        )
        session.add(appointment)
        session.commit()
        session.refresh(appointment)

        # Create Consultation
        consultation = Consultation(
            doctor_id=user.id, 
            patient_id=user.id,
            status=ConsultationStatus.SCHEDULED,
            appointment_id=appointment.id
        )
        session.add(consultation)
        session.commit()
        session.refresh(consultation)
        
        # Create AudioFile
        audio_file = AudioFile(
            consultation_id=consultation.id,
            file_url=dest_path,
            uploaded_by=AudioUploaderType.DOCTOR,
            file_name=filename,
            mime_type="audio/aac"
        )
        session.add(audio_file)
        session.commit()
        
        cid = consultation.id

    # Run AI Flow
    print("Running AI flow (Transcription + SOAP)...")
    try:
        await process_consultation_flow(cid)
    except Exception as e:
        print(f"AI Processing Error: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # Inspect Result
    with Session(engine) as session:
        consultation = session.get(Consultation, cid)
        print(f"\nSTATUS: {consultation.status}")
        
        # Get Transcript
        audio = session.exec(select(AudioFile).where(AudioFile.consultation_id == cid)).first()
        generated_text = audio.transcription.strip() if audio.transcription else ""
        
        print(f"\n--- GENERATED TRANSCRIPT ({len(generated_text)} chars) ---")
        print(generated_text)
        
        # Validation
        print(f"\n--- ACCURACY VALIDATION ---")
        similarity = calculate_similarity(ground_truth_text.lower(), generated_text.lower())
        print(f"Similarity Score: {similarity:.2%}")
        
        print("\n--- DIFF (Ground Truth vs Generated) ---")
        # diff = difflib.ndiff(ground_truth_text.splitlines(), generated_text.splitlines())
        # for line in diff:
        #     print(line)
        
        # Get SOAP
        soap = session.exec(select(SOAPNote).where(SOAPNote.consultation_id == cid)).first()
        if soap:
            print("\n--- SOAP NOTE ---")
            import json
            print(json.dumps(soap.soap_json, indent=2))
        else:
            print("\n!!! NO SOAP NOTE GENERATED !!!")

if __name__ == "__main__":
    asyncio.run(main())
