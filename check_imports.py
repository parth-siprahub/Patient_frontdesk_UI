import sys
print("="*80)
print("PYTHON PATH:")
for p in sys.path:
    print(f"  {p}")
print("="*80)

from app.main import app
print(f"App location: {app}")
print(f"App file: {app.__class__.__module__}")
