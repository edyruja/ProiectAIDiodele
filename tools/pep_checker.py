"""Mock PEP (Politically Exposed Person) association checks."""

from __future__ import annotations

from typing import Any


def check_pep_associations(entity_name: str) -> dict[str, Any]:
    """Return deterministic PEP associations for an entity."""
    if not entity_name or not entity_name.strip():
        raise ValueError("entity_name must be a non-empty string.")

    normalized = entity_name.strip()
    lowered = normalized.lower()

    matches: list[dict[str, Any]] = []
    if "group" in lowered or "international" in lowered:
        matches.append(
            {
                "person_name": "Adrian Popescu",
                "relationship": "Former board advisor",
                "jurisdiction": "RO",
                "risk_note": "Public-office link in prior 5 years.",
            }
        )

    return {
        "entity_name": normalized,
        "matches": matches,
        "pep_match_count": len(matches),
    }
