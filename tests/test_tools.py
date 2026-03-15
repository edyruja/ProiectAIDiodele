"""
Phase 4 – Data Pipeline & OSINT Tooling
QA / Test Engineer – Sub-agent 1

These tests are intentionally written BEFORE the implementation exists (RED phase).
They will fail until Sub-agent 2 (Developer) creates the tools/ package.

TDD Cycle:
  1. Tests written here  → RED  (no implementation yet)
  2. Developer creates tools/  → GREEN
  3. Tests pass, Git action requested.
"""

import pytest

# ---------------------------------------------------------------------------
# Import the functions under test.
# ImportError is the expected failure mode at this stage (RED).
# ---------------------------------------------------------------------------
from tools.company_fetcher import fetch_company_data       # noqa: E402
from tools.address_validator import validate_address        # noqa: E402


# ===========================================================================
# Test 1 – fetch_company_data
# ===========================================================================

class TestFetchCompanyData:
    """Verify the shape and required keys returned by fetch_company_data()."""

    REQUIRED_KEYS = {"name", "status", "directors"}

    def test_returns_dict_for_valid_company(self):
        """fetch_company_data should return a dict for a known company name."""
        result = fetch_company_data("Acme Corp")
        assert isinstance(result, dict), (
            "fetch_company_data() must return a dict, "
            f"got {type(result).__name__!r} instead."
        )

    def test_contains_required_keys(self):
        """Result must contain at least 'name', 'status', and 'directors' keys."""
        result = fetch_company_data("Acme Corp")
        missing = self.REQUIRED_KEYS - result.keys()
        assert not missing, (
            f"fetch_company_data() result is missing required keys: {missing}"
        )

    def test_name_is_string(self):
        """'name' field must be a non-empty string."""
        result = fetch_company_data("Acme Corp")
        assert isinstance(result["name"], str) and result["name"].strip(), (
            "'name' must be a non-empty string."
        )

    def test_status_is_string(self):
        """'status' field must be a non-empty string (e.g. 'active', 'dissolved')."""
        result = fetch_company_data("Acme Corp")
        assert isinstance(result["status"], str) and result["status"].strip(), (
            "'status' must be a non-empty string."
        )

    def test_directors_is_list(self):
        """'directors' field must be a list (may be empty for unknown companies)."""
        result = fetch_company_data("Acme Corp")
        assert isinstance(result["directors"], list), (
            "'directors' must be a list."
        )

    def test_raises_for_empty_company_name(self):
        """fetch_company_data should raise ValueError when given an empty string."""
        with pytest.raises(ValueError, match="company_name"):
            fetch_company_data("")


# ===========================================================================
# Test 2 – validate_address
# ===========================================================================

class TestValidateAddress:
    """Verify the shape and required keys returned by validate_address()."""

    REQUIRED_KEYS = {"is_valid", "type"}

    SAMPLE_ADDRESS = "123 Main Street, Bucharest, Romania"

    def test_returns_dict_for_valid_address(self):
        """validate_address should return a dict for a well-formed address."""
        result = validate_address(self.SAMPLE_ADDRESS)
        assert isinstance(result, dict), (
            "validate_address() must return a dict, "
            f"got {type(result).__name__!r} instead."
        )

    def test_contains_required_keys(self):
        """Result must contain at least 'is_valid' and 'type' keys."""
        result = validate_address(self.SAMPLE_ADDRESS)
        missing = self.REQUIRED_KEYS - result.keys()
        assert not missing, (
            f"validate_address() result is missing required keys: {missing}"
        )

    def test_is_valid_is_bool(self):
        """'is_valid' field must be a boolean."""
        result = validate_address(self.SAMPLE_ADDRESS)
        assert isinstance(result["is_valid"], bool), (
            "'is_valid' must be a bool."
        )

    def test_type_is_string(self):
        """'type' field must be a non-empty string (e.g. 'residential', 'commercial')."""
        result = validate_address(self.SAMPLE_ADDRESS)
        assert isinstance(result["type"], str) and result["type"].strip(), (
            "'type' must be a non-empty string."
        )

    def test_invalid_address_returns_is_valid_false(self):
        """A clearly bogus address should be flagged as not valid."""
        result = validate_address("???? !!!")
        assert result["is_valid"] is False, (
            "A junk address should return {'is_valid': False, ...}."
        )

    def test_raises_for_empty_address(self):
        """validate_address should raise ValueError when given an empty string."""
        with pytest.raises(ValueError, match="address"):
            validate_address("")
