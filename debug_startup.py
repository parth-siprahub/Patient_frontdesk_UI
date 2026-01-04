import traceback
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.main import app
    print("App imported successfully")
except Exception:
    traceback.print_exc()
