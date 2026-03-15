"""Mock sanctions screening utility for AML triage flows."""

from __future__ import annotations

from typing import Any


def check_sanctions(entity_name: str) -> dict[str, Any]:
    """Return deterministic sanctions findings for an entity name."""
    if not entity_name or not entity_name.strip():
        raise ValueError("entity_name must be a non-empty string.")

    normalized = entity_name.strip()
    lowered = normalized.lower()

    hits: list[dict[str, Any]] = []
    if any(flag in lowered for flag in ("global", "holdings", "trading", "offshore")):
        hits.append(
            {
                "list": "OFAC-SDN",
                "match_name": normalized,
                "confidence": 0.86,
                "reason": "Name similarity and high-risk industry keywords.",
            }
        )

    return {
        "entity_name": normalized,
        "screened_lists": ["OFAC", "EU", "UN"],
        "hits": hits,
        "hit_count": len(hits),
    }
