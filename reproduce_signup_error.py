from sqlmodel import Session, select
from app.core.db import engine
from app.core.security import get_password_hash
from app.models.base import User, PatientProfile, UserRole
import traceback

def reproduce():
    email = "repro_user@example.com"
    with Session(engine) as session:
        # Cleanup if exists
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            print("Cleaning up existing user...")
            session.delete(existing)
            session.commit()
        
        try:
            print("Attempting to create User...")
            new_user = User(
                email=email,
                password_hash=get_password_hash("password123"),
                role=UserRole.PATIENT
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            print(f"User created with ID: {new_user.id}")
            
            print("Attempting to create PatientProfile...")
            new_profile = PatientProfile(
                user_id=new_user.id,
                first_name="Test",
                last_name="User",
                phone_number="1234567890"
            )
            session.add(new_profile)
            session.commit()
            print("PatientProfile created successfully!")
            
        except Exception as e:
            print("\n❌ ERROR CAPTURED:")
            print(str(e))
            print("\nTRACEBACK:")
            traceback.print_exc()

if __name__ == "__main__":
    reproduce()
