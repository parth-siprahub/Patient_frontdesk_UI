from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AppointmentCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    doctor_name: str
    scheduled_at: datetime
    reason: Optional[str] = None
    notes: Optional[str] = None
