"""
tools/address_validator.py
Phase 4 – Data Pipeline & OSINT Tooling

Provides validate_address(), which geocodes and classifies a postal address.

NOTE (Phase 4 / Sprint 1):
    Real geocoding (e.g. Google Maps Geocoding API, Nominatim) is stubbed
    with a simple heuristic so the test suite reaches GREEN before API keys
    are provisioned.  Replace _geocode() when credentials are available.
"""

from __future__ import annotations

import re
from typing import Any


# ---------------------------------------------------------------------------
# Heuristic thresholds (tunable)
# ---------------------------------------------------------------------------

# Minimum number of word-like tokens for an address to be considered valid.
_MIN_TOKENS: int = 3

# Regex that a junk address would NOT match (at least one alphanumeric token
# with 2+ chars).
_ALPHA_PATTERN: re.Pattern[str] = re.compile(r"[A-Za-z0-9]{2,}")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate_address(address: str) -> dict[str, Any]:
    """Validate and classify a postal address string.

    Args:
        address: The address to validate.  Must be a non-empty string.

    Returns:
        A dict containing at minimum:
            - ``is_valid`` (bool) – ``True`` if the address appears genuine
            - ``type``     (str)  – classification, e.g. ``"residential"``,
                                    ``"commercial"``, or ``"unknown"``

    Raises:
        ValueError: If *address* is an empty string or whitespace-only.
    """
    if not address or not address.strip():
        raise ValueError("address must be a non-empty string.")

    cleaned: str = address.strip()
    return _geocode(cleaned)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _geocode(address: str) -> dict[str, Any]:
    """Mock geocoding / classification.  Replace with real API call later."""
    is_valid: bool = _looks_valid(address)

    return {
        "is_valid": is_valid,
        "type": _classify(address) if is_valid else "unknown",
        "formatted": address if is_valid else "",
        "latitude": 44.4268 if is_valid else None,
        "longitude": 26.1025 if is_valid else None,
        "country_code": "RO" if is_valid else None,
    }


def _looks_valid(address: str) -> bool:
    """Simple heuristic: address must have ≥ 3 tokens and real alphanumerics."""
    tokens = address.split()
    if len(tokens) < _MIN_TOKENS:
        return False
    if not _ALPHA_PATTERN.search(address):
        return False
    return True


def _classify(address: str) -> str:
    """Naive keyword-based classifier.  Replace with ML model or API later."""
    lowered = address.lower()
    commercial_keywords = ("str.", "strada", "bulevardul", "bd.", "calea",
                           "avenue", "ave", "street", "st.", "road", "rd.",
                           "plaza", "square", "blvd")
    residential_keywords = ("apartment", "apt", "bloc", "bl.", "sc.", "et.",
                             "flat", "suite")

    for kw in residential_keywords:
        if kw in lowered:
            return "residential"

    for kw in commercial_keywords:
        if kw in lowered:
            return "commercial"

    return "residential"  # safe default for well-formed but unclassified
