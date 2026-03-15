"""
One-time migration: add new financial columns to company_profiles.
Safe to run multiple times – checks information_schema before altering.
"""
from database import engine
from sqlalchemy import text

NEW_COLUMNS = [
    ("entity_type", "VARCHAR(50)"),
    ("revenue", "FLOAT"),
    ("average_monthly_spend", "FLOAT"),
    ("expense_categories", "TEXT"),
    ("budget_breakdown", "TEXT"),
]

CHECK_SQL = text("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = :col
""")

with engine.connect() as conn:
    for col_name, col_type in NEW_COLUMNS:
        result = conn.execute(CHECK_SQL, {"col": col_name}).fetchone()
        if result is None:
            conn.execute(text(f"ALTER TABLE company_profiles ADD COLUMN {col_name} {col_type}"))
            print(f"  + Added column: {col_name}")
        else:
            print(f"  ✓ Already exists: {col_name}")
    conn.commit()

print("✅ Migration complete.")

