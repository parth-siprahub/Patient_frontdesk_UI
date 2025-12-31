from app.core.security import get_password_hash
try:
    p = "password123"
    print(f"Hashing: '{p}'")
    h = get_password_hash(p)
    print(f"Hash: {h}")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
