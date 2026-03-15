"""
test_mock_data.py  –  TDD tests for mock data generation
=========================================================

Cycle 1 RED:  Assert new financial & AML columns exist on CompanyProfile.
Cycle 2 RED:  Assert behavioral contracts for generate_random_company().

All tests in this file are expected to FAIL until the developer implements
the corresponding production code changes (GREEN phase).
"""

import json
import pytest


# ---------------------------------------------------------------------------
# Cycle 1 – CompanyProfile schema expansion
# ---------------------------------------------------------------------------

class TestCompanyProfileExpandedSchema:
    """
    Verifies that CompanyProfile declares all new AML & financial columns
    needed for the Financial & AML Intelligence Dashboard.
    """

    NEW_COLUMNS = {
        "entity_type",
        "industry",
        "sanctions_hit",
        "pep_exposure",
        "incorporation_date",
        "revenue",
        "average_monthly_spend",
        "expense_categories",
        "budget_breakdown",
    }

    def test_company_profile_has_financial_and_aml_columns(self):
        """
        All new AML & financial columns must be present on the ORM table.
        Fails (RED) until models.py is updated.
        """
        from models import CompanyProfile

        col_names = {col.name for col in CompanyProfile.__table__.columns}
        missing = self.NEW_COLUMNS - col_names
        assert not missing, (
            f"CompanyProfile is missing required columns: {missing}\n"
            "Add these columns to models.py to turn this test GREEN."
        )

    def test_entity_type_column_is_string(self):
        """entity_type must be a String column (for values like 'SRL', 'SA')."""
        from models import CompanyProfile
        from sqlalchemy import String

        col = CompanyProfile.__table__.c.get("entity_type")
        assert col is not None, "entity_type column not found"
        assert isinstance(col.type, String), (
            f"entity_type must be String, got {type(col.type)}"
        )

    def test_sanctions_hit_column_is_boolean(self):
        """sanctions_hit must be a Boolean column."""
        from models import CompanyProfile
        from sqlalchemy import Boolean

        col = CompanyProfile.__table__.c.get("sanctions_hit")
        assert col is not None, "sanctions_hit column not found"
        assert isinstance(col.type, Boolean), (
            f"sanctions_hit must be Boolean, got {type(col.type)}"
        )

    def test_pep_exposure_column_is_boolean(self):
        """pep_exposure must be a Boolean column."""
        from models import CompanyProfile
        from sqlalchemy import Boolean

        col = CompanyProfile.__table__.c.get("pep_exposure")
        assert col is not None, "pep_exposure column not found"
        assert isinstance(col.type, Boolean), (
            f"pep_exposure must be Boolean, got {type(col.type)}"
        )

    def test_revenue_column_is_float(self):
        """revenue must be a Float column."""
        from models import CompanyProfile
        from sqlalchemy import Float

        col = CompanyProfile.__table__.c.get("revenue")
        assert col is not None, "revenue column not found"
        assert isinstance(col.type, Float), (
            f"revenue must be Float, got {type(col.type)}"
        )

    def test_to_dict_includes_new_fields(self):
        """
        to_dict() must include all new fields so the API response is complete.
        Fails (RED) until to_dict() is updated in models.py.
        """
        from models import CompanyProfile

        # Build a minimal in-memory instance without DB
        cp = CompanyProfile(
            company_name="Test SRL",
            entity_type="SRL",
            industry="Crypto",
            sanctions_hit=True,
            pep_exposure=False,
            revenue=1_000_000.0,
            average_monthly_spend=50_000.0,
            expense_categories='{"Healthcare": 50, "Financial": 50}',
            budget_breakdown='{"need": 50, "want": 30, "save": 20}',
        )
        d = cp.to_dict()

        for field in [
            "entity_type", "industry", "sanctions_hit", "pep_exposure",
            "revenue", "average_monthly_spend",
            "expense_categories", "budget_breakdown",
        ]:
            assert field in d, f"to_dict() missing field: '{field}'"


# ---------------------------------------------------------------------------
# Cycle 2 – generate_random_company() behavioral contracts
# ---------------------------------------------------------------------------

class TestGenerateRandomCompany:
    """
    Defines the behavioral contracts for generate_random_company().
    All tests fail (RED) until generate_mock_data.py is created.
    """

    def test_function_is_importable(self):
        """generate_mock_data must expose generate_random_company()."""
        from generate_mock_data import generate_random_company  # noqa: F401
        assert callable(generate_random_company)

    def test_returns_dict_with_all_required_keys(self):
        """generate_random_company() must return a dict with all expected keys."""
        from generate_mock_data import generate_random_company

        c = generate_random_company()
        required_keys = {
            "company_name", "registration_number", "country", "address",
            "status", "entity_type", "industry", "directors",
            "incorporation_date", "sanctions_hit", "pep_exposure",
            "risk_score", "risk_label", "risk_explanation",
            "revenue", "average_monthly_spend",
            "expense_categories", "budget_breakdown",
        }
        missing = required_keys - set(c.keys())
        assert not missing, f"generate_random_company() missing keys: {missing}"

    def test_risk_score_is_between_0_and_1(self):
        """risk_score must be a float in [0.0, 1.0]."""
        from generate_mock_data import generate_random_company

        for _ in range(20):
            c = generate_random_company()
            assert 0.0 <= c["risk_score"] <= 1.0, (
                f"risk_score out of range: {c['risk_score']}"
            )

    def test_risk_label_matches_score(self):
        """risk_label must be LOW, MEDIUM, or HIGH and consistent with score."""
        from generate_mock_data import generate_random_company

        for _ in range(20):
            c = generate_random_company()
            assert c["risk_label"] in ("LOW", "MEDIUM", "HIGH"), (
                f"Unexpected risk_label: {c['risk_label']}"
            )

    def test_sanctions_hit_raises_risk_score_above_threshold(self):
        """Any company with sanctions_hit=True must have risk_score >= 0.8."""
        from generate_mock_data import generate_random_company
        import random

        random.seed(0)
        results = [generate_random_company() for _ in range(300)]
        sanctioned = [r for r in results if r["sanctions_hit"]]

        # If 10% chance, we expect ~30 sanctioned in 300. Assert scoring rule.
        assert sanctioned, "No sanctioned companies found in 300 samples – check probability"
        for r in sanctioned:
            assert r["risk_score"] >= 0.8, (
                f"Sanctioned company has risk_score={r['risk_score']}, expected >= 0.8"
            )

    def test_directors_is_a_json_string_of_list(self):
        """directors must be a JSON-encoded string containing a list."""
        from generate_mock_data import generate_random_company

        c = generate_random_company()
        assert isinstance(c["directors"], str), "directors must be a JSON string"
        parsed = json.loads(c["directors"])
        assert isinstance(parsed, list), "directors JSON must decode to a list"
        assert 1 <= len(parsed) <= 6, (
            f"directors list length {len(parsed)} not in [1, 6]"
        )

    def test_expense_categories_sum_to_100(self):
        """expense_categories percentages must sum to exactly 100."""
        from generate_mock_data import generate_random_company

        for _ in range(10):
            c = generate_random_company()
            cats = json.loads(c["expense_categories"])
            assert isinstance(cats, dict), "expense_categories must be a JSON object"
            total = sum(cats.values())
            assert total == 100, (
                f"expense_categories sum to {total}, expected 100. Got: {cats}"
            )

    def test_budget_breakdown_has_need_want_save(self):
        """budget_breakdown must have 'need', 'want', 'save' keys."""
        from generate_mock_data import generate_random_company

        c = generate_random_company()
        bd = json.loads(c["budget_breakdown"])
        assert "need" in bd and "want" in bd and "save" in bd, (
            f"budget_breakdown missing keys: {bd}"
        )

    def test_revenue_is_in_expected_range(self):
        """revenue must be between $50,000 and $5,000,000."""
        from generate_mock_data import generate_random_company

        for _ in range(20):
            c = generate_random_company()
            assert 50_000 <= c["revenue"] <= 5_000_000, (
                f"revenue {c['revenue']} out of expected range"
            )


# ---------------------------------------------------------------------------
# Cycle 2 – populate_db() integration contract
# ---------------------------------------------------------------------------

class TestPopulateDb:
    """
    Verifies that populate_db() inserts exactly 50 records into the DB.
    Uses an in-memory SQLite DB to stay hermetic.
    """

    def test_populate_db_inserts_50_records(self):
        """populate_db() must insert exactly 50 CompanyProfile records."""
        from unittest.mock import patch, MagicMock

        mock_session = MagicMock()
        mock_session_factory = MagicMock(return_value=mock_session)

        with patch("generate_mock_data.SessionLocal", mock_session_factory):
            from generate_mock_data import populate_db
            populate_db()

        # add() should have been called 50 times
        assert mock_session.add.call_count == 50, (
            f"Expected 50 add() calls, got {mock_session.add.call_count}"
        )
        mock_session.commit.assert_called_once()
