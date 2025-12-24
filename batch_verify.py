import asyncio
import os
import shutil
import csv
import glob
from uuid import uuid4
from datetime import datetime, timezone
from sqlmodel import Session, select, create_engine, SQLModel
from app.models.base import Consultation, AudioFile, PatientProfile, User, SOAPNote, ConsultationStatus, AudioUploaderType, UserRole, Appointment, AppointmentStatus
from app.services.consultation_processor import process_consultation_flow
from app.core.config import settings

# Setup DB for Batch Run
DATABASE_URL = "sqlite:///batch_verification.db"
engine = create_engine(DATABASE_URL)
SQLModel.metadata.create_all(engine)

REPORT_FILE = "batch_verification_report.csv"
AUDIO_DIR = "test-audios"

async def process_single_file(file_path):
    filename = os.path.basename(file_path)
    print(f"Processing: {filename}...")
    
    # 1. Simulate Upload
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    unique_name = f"{uuid4()}_{filename}"
    dest_path = os.path.join(upload_dir, unique_name)
    shutil.copy(file_path, dest_path)
    
    cid = None
    
    try:
        with Session(engine) as session:
            # Create Dummy Data
            user_email = f"user_{uuid4()}@example.com"
            user = User(email=user_email, password_hash="pw", is_active=True, role=UserRole.PATIENT)
            session.add(user)
            session.commit()
            session.refresh(user)
            
            patient = PatientProfile(
                user_id=user.id, first_name="Batch", last_name="Patient", 
                date_of_birth=datetime.fromisoformat("1970-01-01"), gender="Male", city="BatchCity"
            )
            session.add(patient)
            
            # Create Appointment (UTC aware)
            appointment = Appointment(
                patient_id=user.id, doctor_id=user.id, scheduled_at=datetime.now(timezone.utc), status=AppointmentStatus.SCHEDULED
            )
            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            
            consultation = Consultation(
                doctor_id=user.id, patient_id=user.id, status=ConsultationStatus.SCHEDULED, appointment_id=appointment.id
            )
            session.add(consultation)
            session.commit()
            session.refresh(consultation)
            
            audio_file = AudioFile(
                consultation_id=consultation.id,
                file_url=dest_path,
                uploaded_by=AudioUploaderType.PATIENT,
                file_name=filename
            )
            session.add(audio_file)
            session.commit()
            cid = consultation.id

        # 2. Run Flow
        await process_consultation_flow(cid)
        
        # 3. Harvest Results
        with Session(engine) as session:
            consultation = session.get(Consultation, cid)
            soap = session.exec(select(SOAPNote).where(SOAPNote.consultation_id == cid)).first()
            status = consultation.status
            
            generated = False
            risk_flags = []
            low_confidence = []
            soap_snippet = ""
            
            if soap:
                generated = True
                risk_flags = soap.risk_flags.get('flags', []) if soap.risk_flags else []
                low_confidence = soap.low_confidence if soap.low_confidence else []
                if soap.soap_json:
                    soap_snippet = str(soap.soap_json)[:100].replace("\n", " ")
            
            return {
                "Filename": filename,
                "Status": status,
                "SOAP Generated": generated,
                "Low Confidence Count": len(low_confidence),
                "Low Confidence Terms": "; ".join(low_confidence),
                "Risk Flags": "; ".join(risk_flags),
                "Snippet": soap_snippet
            }

    except Exception as e:
        print(f"Error processing {filename}: {e}")
        import traceback
        traceback.print_exc()
        return {
            "Filename": filename,
            "Status": "ERROR",
            "SOAP Generated": False,
            "Low Confidence Count": 0,
            "Low Confidence Terms": str(e),
            "Risk Flags": "",
            "Snippet": ""
        }

async def main():
    files = glob.glob(os.path.join(AUDIO_DIR, "*.wav")) + glob.glob(os.path.join(AUDIO_DIR, "*.aac")) + glob.glob(os.path.join(AUDIO_DIR, "*.mp3"))
    files.sort()
    
    print(f"Found {len(files)} files in {AUDIO_DIR}")
    # Process files
    # LIMIT to 5 for Accuracy Calibration
    limit = 5 
    print(f"Running Accuracy Calibration (limit={limit}) on {len(files)} files...")
    
    results = [] # Restore initialization
    files_to_process = files[:limit] if limit else files
    
    for i, file_path in enumerate(files_to_process):
        print(f"[{i+1}/{len(files_to_process)}] Starting {os.path.basename(file_path)}")
        result = await process_single_file(file_path)
        results.append(result)
        print(f"Finished {os.path.basename(file_path)}")

        # Incremental Save (in case of crash)
        if i % 5 == 0 or i == len(files) - 1:
            if results:
                keys = results[0].keys()
                with open(REPORT_FILE, 'w', newline='') as output_file:
                    dict_writer = csv.DictWriter(output_file, keys)
                    dict_writer.writeheader()
                    dict_writer.writerows(results)
                print(f"Progress saved to {REPORT_FILE}")
        
        # RATE LIMIT THROTTLE: Sleep 10s between files to respect Free Tier Limits
        print("Sleeping 10s to avoid rate limits...")
        time.sleep(10)

    print(f"\nBatch processing complete. Report saved to {REPORT_FILE}")

if __name__ == "__main__":
    asyncio.run(main())
