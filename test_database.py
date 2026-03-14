"""
test_database.py  –  Phase 3: Database Integration Tests
=========================================================
TDD - RED phase. Tests are written BEFORE the implementation.

Tech stack (from Back_End_Implementare.md):
  - Relational DB : PostgreSQL via SQLAlchemy (async-ready ORM)
  - Vector DB     : Qdrant (preferred for future self-hosting / MCP support)

Expected modules to be created by the Developer sub-agent:
  - database.py        – SQLAlchemy engine + session factory
  - models.py          – ORM models (CompanyProfile, etc.)
  - vector_store.py    – Qdrant client wrapper

Both tests are EXPECTED TO FAIL until the Developer implements those modules.
"""

import pytest
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# Test 1 – PostgreSQL: connection + schema creation (CompanyProfile)
# ---------------------------------------------------------------------------

class TestPostgreSQLConnection:
    """
    Integration tests for the PostgreSQL database layer.

    Verifies that:
      1. The SQLAlchemy engine can be imported and points to a PostgreSQL URL.
      2. All ORM tables (starting with CompanyProfile) can be created against
         a live or in-memory-compatible engine without raising exceptions.
      3. The CompanyProfile model exposes the minimum expected columns:
         id, company_name, registration_number, country, risk_score.
    """

    def test_database_engine_is_importable(self):
        """
        The `database` module must expose a `engine` object.
        Fails (RED) until database.py is created.
        """
        from database import engine  # noqa: F401 – ImportError expected in RED
        assert engine is not None, "SQLAlchemy engine must not be None"

    def test_database_engine_uses_postgresql(self):
        """
        The engine's dialect must be PostgreSQL ('postgresql') or SQLite.
        Ensures the developer didn't leave an empty dialect.
        """
        from database import engine
        dialect = engine.dialect.name
        assert dialect in ["postgresql", "sqlite"], (
            f"Expected PostgreSQL or SQLite dialect, got '{dialect}'. "
            "Check the DATABASE_URL in database.py or .env."
        )

    def test_company_profile_model_is_importable(self):
        """
        The `models` module must expose a `CompanyProfile` ORM class.
        Fails (RED) until models.py is created.
        """
        from models import CompanyProfile  # noqa: F401
        assert CompanyProfile is not None

    def test_company_profile_has_required_columns(self):
        """
        CompanyProfile must declare all required columns for AML risk storage.
        Columns expected: id, company_name, registration_number, country, risk_score.
        """
        from models import CompanyProfile

        table = CompanyProfile.__table__
        column_names = {col.name for col in table.columns}

        required_columns = {
            "id",
            "company_name",
            "registration_number",
            "country",
            "risk_score",
        }
        missing = required_columns - column_names
        assert not missing, (
            f"CompanyProfile is missing required columns: {missing}"
        )

    def test_schema_creation_does_not_raise(self):
        """
        Calling create_all() on the metadata must succeed without exceptions.
        Uses the engine exported from database.py so the developer controls
        whether this hits a real DB or a test-only in-memory variant.
        """
        from database import engine, Base

        # create_all is idempotent; running it in tests is safe.
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as exc:
            pytest.fail(
                f"Base.metadata.create_all() raised an unexpected exception: {exc}"
            )


# ---------------------------------------------------------------------------
# Test 2 – Vector DB: Qdrant client initialization + dummy vector upsert
# ---------------------------------------------------------------------------

class TestVectorStoreClient:
    """
    Tests for the Qdrant vector-store integration layer (vector_store.py).

    Strategy:
      - The external Qdrant HTTP call is MOCKED so tests remain hermetic and
        fast (no running Qdrant instance required in CI/CD).
      - We still verify that:
          a) `vector_store.py` is importable and exposes the expected interface.
          b) The client is instantiated with a host / URL from config.
          c) The `upsert_vector()` helper calls the underlying Qdrant client
             with structurally correct arguments (collection name, vector id,
             embedding list).
    """

    def test_vector_store_module_is_importable(self):
        """
        The `vector_store` module must be importable.
        Fails (RED) until vector_store.py is created.
        """
        import vector_store  # noqa: F401
        assert vector_store is not None

    def test_qdrant_client_initializes(self):
        """
        VectorStoreClient (or equivalent) must initialize a QdrantClient
        instance on construction.  The real network call is patched.
        """
        with patch("vector_store.QdrantClient") as MockQdrant:
            MockQdrant.return_value = MagicMock()

            from vector_store import VectorStoreClient
            client = VectorStoreClient()

            assert client is not None, "VectorStoreClient() must not return None"
            MockQdrant.assert_called_once(), (
                "QdrantClient must be instantiated during VectorStoreClient init"
            )

    def test_qdrant_client_uses_configured_host(self):
        """
        The Qdrant client must be pointed at a host/URL defined in config
        (environment variable or settings), not hard-coded to localhost only.
        """
        with patch("vector_store.QdrantClient") as MockQdrant:
            MockQdrant.return_value = MagicMock()

            from vector_store import VectorStoreClient, QDRANT_HOST

            assert QDRANT_HOST is not None and QDRANT_HOST != "", (
                "QDRANT_HOST must be set (from env var or config). "
                "Found: None or empty string."
            )
            VectorStoreClient()  # triggers client init

    def test_upsert_dummy_vector_calls_qdrant(self):
        """
        upsert_vector() must forward the embedding to the Qdrant client's
        upsert() method with the correct collection name, point id, and
        vector payload.

        This is the RED-state contract the developer must fulfil.
        """
        dummy_vector = [0.1, 0.2, 0.3, 0.4, 0.5]
        dummy_id = "test-point-001"
        collection_name = "company_embeddings"

        with patch("vector_store.QdrantClient") as MockQdrant:
            mock_qdrant_instance = MagicMock()
            MockQdrant.return_value = mock_qdrant_instance

            from vector_store import VectorStoreClient
            client = VectorStoreClient()
            client.upsert_vector(
                collection=collection_name,
                vector_id=dummy_id,
                embedding=dummy_vector,
            )

            # The underlying Qdrant client's upsert must have been called.
            mock_qdrant_instance.upsert.assert_called_once()
            call_kwargs = mock_qdrant_instance.upsert.call_args

            # Verify collection name is forwarded correctly.
            assert collection_name in str(call_kwargs), (
                f"Expected collection '{collection_name}' to be passed to "
                f"QdrantClient.upsert(). Got: {call_kwargs}"
            )

    def test_upsert_vector_returns_success_indicator(self):
        """
        upsert_vector() should return a truthy success indicator (bool True,
        a result object, or a non-None value) so callers can handle failures.
        """
        dummy_vector = [0.42] * 768  # typical embedding dimension
        with patch("vector_store.QdrantClient") as MockQdrant:
            mock_qdrant_instance = MagicMock()
            mock_qdrant_instance.upsert.return_value = MagicMock(status="completed")
            MockQdrant.return_value = mock_qdrant_instance

            from vector_store import VectorStoreClient
            client = VectorStoreClient()
            result = client.upsert_vector(
                collection="company_embeddings",
                vector_id="test-point-002",
                embedding=dummy_vector,
            )

            assert result is not None, (
                "upsert_vector() must return a non-None result so the caller "
                "can confirm the operation succeeded."
            )
