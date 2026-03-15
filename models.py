"""
models.py – SQLAlchemy ORM models for the Antigravity AML System.

Phase 3: Database Integration

Models defined here:
  - CompanyProfile : Core entity for storing company data and AML risk scores.

All models inherit from `Base` (declared in database.py).
"""

from datetime import datetime, timezone
import json
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from database import Base


# ---------------------------------------------------------------------------
# CompanyProfile ORM Model
# ---------------------------------------------------------------------------

class CompanyProfile(Base):
    """
    Stores structured data about a company under AML investigation.

    Populated by the OSINT pipeline (Phase 4) and annotated by the
    Analyst Agent (Phase 5) with a risk_score and chain-of-thought
    explanation.
    """

    __tablename__ = "company_profiles"

    # Primary key
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Core identification fields (required by test_database.py)
    company_name = Column(String(255), nullable=False, index=True)
    registration_number = Column(String(100), nullable=True, unique=True, index=True)
    country = Column(String(100), nullable=True)

    # AML risk assessment
    risk_score = Column(Float, nullable=True)          # 0.0 – 1.0 range
    risk_label = Column(String(50), nullable=True)     # "LOW" | "MEDIUM" | "HIGH"
    risk_explanation = Column(Text, nullable=True)     # Chain-of-thought from agent
    
    # New real-world AML attributes
    industry = Column(String(100), nullable=True)
    incorporation_date = Column(String(50), nullable=True)
    sanctions_hit = Column(Boolean, default=False)
    pep_exposure = Column(Boolean, default=False)

    # Company status from registry
    status = Column(String(50), nullable=True)         # "active" | "dissolved" | etc.

    # Legal entity type (e.g. SRL, SA, PFA, ONG, Persoană Fizică)
    entity_type = Column(String(50), nullable=True)

    # Financial intelligence fields
    revenue = Column(Float, nullable=True)                     # Annual turnover / income
    average_monthly_spend = Column(Float, nullable=True)       # Estimated monthly spend
    expense_categories = Column(Text, nullable=True)           # JSON: {category: pct, ...}
    budget_breakdown = Column(Text, nullable=True)             # JSON: {need, want, save}

    # Additional metadata
    address = Column(String(500), nullable=True)
    directors = Column(Text, nullable=True)            # JSON string of director list
    source_url = Column(String(500), nullable=True)    # OSINT source

    # Timestamps
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=True,
    )

    def __repr__(self) -> str:
        return (
            f"<CompanyProfile(id={self.id!r}, "
            f"company_name={self.company_name!r}, "
            f"risk_score={self.risk_score!r})>"
        )

    def to_dict(self) -> dict:
        """Serialize the model to a plain dictionary (used by FastAPI responses)."""
        def _parse_json(value):
            if value:
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    pass
            return None

        directors_list = _parse_json(self.directors) or []

        return {
            "id": self.id,
            "company_name": self.company_name,
            "registration_number": self.registration_number,
            "country": self.country,
            "status": self.status,
            "entity_type": self.entity_type,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "risk_explanation": self.risk_explanation,
            "industry": self.industry,
            "incorporation_date": self.incorporation_date,
            "sanctions_hit": self.sanctions_hit,
            "pep_exposure": self.pep_exposure,
            "revenue": self.revenue,
            "average_monthly_spend": self.average_monthly_spend,
            "expense_categories": _parse_json(self.expense_categories),
            "budget_breakdown": _parse_json(self.budget_breakdown),
            "address": self.address,
            "directors": directors_list,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
