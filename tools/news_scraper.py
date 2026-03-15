"""Mock adverse news retrieval for AML investigations."""

from __future__ import annotations

from typing import Any


def search_adverse_news(entity_name: str) -> dict[str, Any]:
    """Return deterministic adverse media references for an entity."""
    if not entity_name or not entity_name.strip():
        raise ValueError("entity_name must be a non-empty string.")

    normalized = entity_name.strip()
    risk_seed = sum(ord(ch) for ch in normalized) % 3

    articles: list[dict[str, Any]] = []
    if risk_seed >= 1:
        articles.append(
            {
                "title": f"Regulators review transactions linked to {normalized}",
                "source": "Global Finance Monitor",
                "published_at": "2025-11-03",
                "sentiment": "negative",
            }
        )
    if risk_seed >= 2:
        articles.append(
            {
                "title": f"Whistleblower report mentions {normalized}",
                "source": "Investigative Ledger",
                "published_at": "2026-01-15",
                "sentiment": "negative",
            }
        )

    return {
        "entity_name": normalized,
        "articles": articles,
        "article_count": len(articles),
    }
