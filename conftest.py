"""
conftest.py – Pytest configuration and fixtures for the Antigravity AML test suite.

Phase 3 notes:
    - `test_database_engine_uses_postgresql` tests the dialect of the real engine
      (which is configured via DATABASE_URL, defaulting to postgresql://...).
      This test does NOT make a network connection; SQLAlchemy resolves the dialect
      from the URL string alone, so no live PostgreSQL is required.

    - `test_schema_creation_does_not_raise` actually runs create_all(), which
      DOES require a connectable engine.  The `sqlite_engine` fixture patches
      `database.engine` with an in-memory SQLite engine for that test, as the
      test docstring explicitly allows: "the developer controls whether this
      hits a real DB or a test-only in-memory variant."
"""

import pytest
from unittest.mock import patch
from sqlalchemy import create_engine as _create_engine


@pytest.fixture(autouse=False)
def sqlite_engine(monkeypatch):
    """
    Replace `database.engine` with an in-memory SQLite engine for tests that
    need to run `create_all()` without a live PostgreSQL instance.

    Apply this fixture explicitly by requesting it in the test signature, or
    add the marker below to a whole class:

        @pytest.mark.usefixtures("sqlite_engine")
        class TestSomething:
            ...
    """
    import database

    test_engine = _create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    monkeypatch.setattr(database, "engine", test_engine)
    yield test_engine
    test_engine.dispose()


# ---------------------------------------------------------------------------
# Patch the schema creation test to use SQLite without modifying test_database.py
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def patch_engine_for_schema_test(request, monkeypatch):
    """
    Automatically patches `database.engine` with an in-memory SQLite engine
    ONLY for the `test_schema_creation_does_not_raise` test.

    All other tests continue to use the real (PostgreSQL-dialect) engine so
    that dialect assertions pass correctly.
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
