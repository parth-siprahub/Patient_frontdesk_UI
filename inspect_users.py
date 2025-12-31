from app.core.db import engine
from sqlalchemy import inspect

ins = inspect(engine)
columns = ins.get_columns('users')
print("--- Schema for users ---")
for c in columns:
    print(f"Column: {c['name']}")
    print(f"  Type: {c['type']}")
    print(f"  Nullable: {c['nullable']}")
    print(f"  Default: {c.get('default')}")
    print("-" * 30)
