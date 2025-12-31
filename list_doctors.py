from app.core.db import engine
from sqlalchemy import text
with engine.connect() as conn:
    res = conn.execute(text('SELECT u.id, dp.first_name, dp.last_name FROM users u JOIN doctor_profiles dp ON u.id = dp.user_id'))
    doctors = res.fetchall()
    print("Available Doctors:")
    for doctor in doctors:
        print(f"ID: {doctor[0]} | Name: {doctor[1]} {doctor[2]}")
