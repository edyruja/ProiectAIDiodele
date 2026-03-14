"""
models.py – SQLAlchemy ORM models for the Antigravity AML System.

Phase 3: Database Integration

Models defined here:
  - CompanyProfile : Core entity for storing company data and AML risk scores.

All models inherit from `Base` (declared in database.py).
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
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

    # Company status from registry
    status = Column(String(50), nullable=True)         # "active" | "dissolved" | etc.

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
        return {
            "id": self.id,
            "company_name": self.company_name,
            "registration_number": self.registration_number,
            "country": self.country,
            "status": self.status,
            "risk_score": self.risk_score,
            "risk_label": self.risk_label,
            "risk_explanation": self.risk_explanation,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
