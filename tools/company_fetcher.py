"""
tools/company_fetcher.py
Phase 4 – Data Pipeline & OSINT Tooling

Provides fetch_company_data(), which queries commercial registers and
sanctions databases for a given company name.

NOTE (Phase 4 / Sprint 1):
    Real API integrations (e.g. Companies House, ANAF, OpenSanctions) are
    stubbed out with deterministic mock data so that the test suite
    can reach GREEN before live credentials are provisioned.
    Replace the body of _query_registry() when real keys are available.
"""

from __future__ import annotations

import re
from typing import Any


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def fetch_company_data(company_name: str) -> dict[str, Any]:
    """Return a profile dict for the requested company.

    Args:
        company_name: The legal name of the company to look up.
                      Must be a non-empty string.

    Returns:
        A dict containing at minimum:
            - ``name``      (str)  – normalised company name
            - ``status``    (str)  – e.g. ``"active"``, ``"dissolved"``
            - ``directors`` (list) – list of director name strings

    Raises:
        ValueError: If *company_name* is an empty string or whitespace-only.
    """
    if not company_name or not company_name.strip():
        raise ValueError("company_name must be a non-empty string.")

    normalised: str = company_name.strip()
    return _query_registry(normalised)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _query_registry(company_name: str) -> dict[str, Any]:
    """Mock registry query.  Replace with real HTTP calls in production."""
    return {
        "name": company_name,
        "status": "active",
        "directors": ["Jane Doe", "John Smith"],
        "registration_number": "RO12345678",
        "country": "RO",
        "address": "Str. Exemplu nr. 1, București",
        "sanctions_hits": [],
    }
