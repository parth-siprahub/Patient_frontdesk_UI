from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.core.db import get_session
from app.models.base import Consultation, PatientProfile, User, UserRole, ConsultationStatus, Appointment
from app.api.deps import RoleChecker

router = APIRouter()

@router.get("/triage_queue", response_model=List[Dict[str, Any]])
def get_triage_queue(
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.FRONT_DESK, UserRole.DOCTOR]))
):
    """
    Returns the live triage queue for admin/doctor use.
    Sorted by urgency_score DESC and created_at ASC.
    """
    statement = (
        select(Consultation, PatientProfile)
        .join(PatientProfile, Consultation.patient_id == PatientProfile.user_id)
        .where(Consultation.status != ConsultationStatus.COMPLETED)
        .order_by(Consultation.urgency_score.desc(), Consultation.created_at.asc())
    )
    results = session.exec(statement).all()
    
    queue = []
    for consultation, profile in results:
        queue.append({
            "id": str(consultation.id),
            "appointment_id": str(consultation.appointment_id),
            "name": f"{profile.first_name} {profile.last_name}",
            "phone": profile.phone_number or "N/A",
            "triageScore": consultation.urgency_score or 5,
            "symptoms": consultation.notes or "No symptoms provided",
            "checkInTime": consultation.created_at.isoformat()
        })
    return queue

@router.patch("/assign/{appointment_id}", response_model=Dict[str, Any])
def assign_doctor(
    appointment_id: UUID,
    payload: Dict[str, UUID],
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.FRONT_DESK]))
):
    doctor_id = payload.get("doctor_id")
    if not doctor_id:
        raise HTTPException(status_code=422, detail="doctor_id is required")

    appointment = session.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    doctor = session.get(User, doctor_id)
    if not doctor or doctor.role != UserRole.DOCTOR:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    appointment.doctor_id = doctor_id
    
    # Update doctor_name if doctor has a profile
    statement = select(User).where(User.id == doctor_id)
    # We already have doctor object, but let's be sure about the profile
    if doctor.doctor_profile:
        appointment.doctor_name = f"Dr. {doctor.doctor_profile.first_name} {doctor.doctor_profile.last_name}"
        
    session.add(appointment)
    session.commit()
    return {"message": "Patient assigned successfully", "doctor_name": appointment.doctor_name}

@router.post("/check-in", response_model=Dict[str, Any])
def bulk_check_in(
    payload: Dict[str, Any],
    session: Session = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.FRONT_DESK]))
):
    patient_id = payload.get("patient_id")
    doctor_id = payload.get("doctor_id")
    notes = payload.get("notes", "")

    if not patient_id or not doctor_id:
        raise HTTPException(status_code=422, detail="patient_id and doctor_id are required")

    # Create Appointment
    appointment = Appointment(
        patient_id=patient_id,
        doctor_id=doctor_id,
        scheduled_at=datetime.utcnow(),
        reason=notes[:100] if notes else "Walk-in",
        status="CHECKED_IN"
    )
    
    # Get doctor name
    doctor = session.get(User, doctor_id)
    if doctor and doctor.doctor_profile:
        appointment.doctor_name = f"Dr. {doctor.doctor_profile.first_name} {doctor.doctor_profile.last_name}"
        
    session.add(appointment)
    session.commit()
    session.refresh(appointment)
    
    # Create Consultation
    consultation = Consultation(
        appointment_id=appointment.id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        status="IN_PROGRESS",
        notes=notes
    )
    session.add(consultation)
    session.commit()
    session.refresh(consultation)
    
    return {
        "message": "Patient checked in successfully",
        "appointment_id": str(appointment.id),
        "consultation_id": str(consultation.id)
    }
