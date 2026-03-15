import sys, traceback, os
try:
    from dotenv import load_dotenv
    load_dotenv()
    from sqlalchemy import create_engine, text
    from sqlalchemy.pool import NullPool

    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aml_db")
    engine = create_engine(DATABASE_URL, poolclass=NullPool)

    NEW_COLUMNS = [
        ("entity_type", "VARCHAR(50)"),
        ("revenue", "FLOAT"),
        ("average_monthly_spend", "FLOAT"),
        ("expense_categories", "TEXT"),
        ("budget_breakdown", "TEXT"),
    ]

    CHECK_SQL = "SELECT column_name FROM information_schema.columns WHERE table_name = 'company_profiles' AND column_name = '{col}'"

    with engine.connect() as conn:
        for col_name, col_type in NEW_COLUMNS:
            result = conn.execute(text(CHECK_SQL.format(col=col_name))).fetchone()
            if result is None:
                conn.execute(text(f"ALTER TABLE company_profiles ADD COLUMN {col_name} {col_type}"))
                print(f"  + Added column: {col_name}")
            else:
                print(f"  already exists: {col_name}")
        conn.commit()
    print("Migration complete.")
except Exception:
    traceback.print_exc()
