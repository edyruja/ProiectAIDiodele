"""
conftest.py – Pytest configuration and fixtures for the Antigravity AML test suite.
"""

import pytest
from unittest.mock import patch
from sqlalchemy import create_engine as _create_engine
from sqlalchemy.orm import sessionmaker
from database import Base

@pytest.fixture(autouse=False)
def sqlite_engine(monkeypatch):
    """
    Replace `database.engine` with an in-memory SQLite engine for tests that
    need to run `create_all()` without a live PostgreSQL instance.
    """
    import database

    test_engine = _create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    monkeypatch.setattr(database, "engine", test_engine)
    yield test_engine
    test_engine.dispose()

@pytest.fixture(autouse=True)
def patch_engine_for_schema_test(request, monkeypatch):
    """
    Automatically patches `database.engine` with an in-memory SQLite engine
    ONLY for the `test_schema_creation_does_not_raise` test.
    """
    if request.node.name == "test_schema_creation_does_not_raise":
        import database
        test_engine = _create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
        monkeypatch.setattr(database, "engine", test_engine)
        yield
        test_engine.dispose()
    else:
        yield

@pytest.fixture
def db_session(sqlite_engine):
    """
    Provide a clean SQLAlchemy session for a test using an in-memory SQLite DB.
    Automatically creates all tables before each test and drops them after.
    """
    connection = sqlite_engine.connect()
    transaction = connection.begin()
    
    Session = sessionmaker(bind=connection)
    session = Session()

    # Create tables in the SQLite instance
    Base.metadata.create_all(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()
