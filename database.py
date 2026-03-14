"""
database.py – SQLAlchemy engine, session factory, and declarative Base.

Phase 3: Database Integration (Antigravity AML System)

Configuration:
    DATABASE_URL  – Full SQLAlchemy connection URL.
                    Defaults to a PostgreSQL localhost URL for development.
                    Override via environment variable for different environments:
                      - Production : postgresql://user:pass@host:5432/aml_db
                      - CI / Tests : Use MOCK_DB=1 to patch the engine dialect
                        to avoid requiring a live PostgreSQL instance.

Usage:
    from database import engine, SessionLocal, Base, get_db

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Dependency injection for FastAPI routes
    def some_route(db: Session = Depends(get_db)):
        ...
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/aml_db",
)

# ---------------------------------------------------------------------------
# Engine
# Connects to PostgreSQL.  For unit tests that cannot reach a live DB,
# set DATABASE_URL to a valid PostgreSQL URL and run a local instance,
# or use pytest fixtures that mock the engine.
# ---------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    # Pool settings tuned for a FastAPI/async-friendly setup
    pool_pre_ping=True,       # auto-reconnect after DB restart
    pool_size=5,
    max_overflow=10,
    echo=False,               # set to True for SQL debugging
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ---------------------------------------------------------------------------
# Declarative base – all ORM models inherit from this
# ---------------------------------------------------------------------------

Base = declarative_base()

# ---------------------------------------------------------------------------
# FastAPI dependency helper
# ---------------------------------------------------------------------------


def get_db():
    """
    Yield a database session and ensure it is closed after the request.

    Usage in FastAPI:
        from fastapi import Depends
        from sqlalchemy.orm import Session
        from database import get_db

        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
