"""
generate_mock_data.py  –  Populate the AML database with 50 mock companies.

Implements a deterministic risk engine and realistic financial data so
the analyst agent has rich data to work with.

Usage:
    python generate_mock_data.py
"""

import json
import random
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
from models import CompanyProfile

# Ensure all tables exist before inserting
Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Data building blocks
# ---------------------------------------------------------------------------

PREFIXES = ["Alpha", "Beta", "Delta", "Omega", "Sigma", "Prime", "Nova",
            "Apex", "Vertex", "Zenith", "Aurora", "Titan", "Nexus", "Orion"]

SUFFIXES = ["Group", "Holdings", "Solutions", "Ventures", "Capital",
            "Partners", "Consulting", "Industries", "Services", "Global"]

COUNTRIES = [
    "Romania", "Germany", "France", "Netherlands", "United Kingdom",
    "United States", "Switzerland", "Singapore", "Malta", "Cyprus",
    "Cayman Islands", "Panama", "British Virgin Islands", "Luxembourg",
    "Ireland", "Spain", "Italy", "Portugal",
]

TAX_HAVENS = {"Cayman Islands", "Panama", "British Virgin Islands", "Malta", "Cyprus"}

STATUSES = ["active", "active", "active", "dissolved", "suspended", "inactive"]

ENTITY_TYPES = ["SRL", "SA", "PFA", "ONG", "Persoană Fizică"]

INDUSTRIES = [
    "Real Estate", "Crypto", "Retail", "Logistics", "IT Services",
    "Finance", "Healthcare", "Manufacturing", "Entertainment", "Education",
]

HIGH_RISK_INDUSTRIES = {"Crypto", "Real Estate", "Finance"}

DIRECTOR_NAMES = [
    "Andrei Popescu", "Maria Ionescu", "Alexandru Constantin", "Elena Radu",
    "Mihai Dumitrescu", "Ana Popa", "Cristian Gheorghe", "Ioana Stoica",
    "Bogdan Munteanu", "Carmen Florescu", "Vlad Petrescu", "Laura Dima",
    "Radu Andrei", "Simona Niculescu", "Gabriel Mocanu", "Teodora Luca",
    "John Smith", "Jane Doe", "Carlos Mendez", "Sophie Laurent",
    "Ahmed Al-Rashid", "Yuki Tanaka", "Lena Müller", "Ivan Petrov",
]

STREETS = [
    "Strada Dorobanților", "Calea Victoriei", "Bulevardul Unirii",
    "Strada Florilor", "Strada Mihai Eminescu", "Avenue des Champs",
    "High Street", "Main Street", "Bahnhofstraße", "Rue de la Paix",
]


# ---------------------------------------------------------------------------
# Risk engine helpers
# ---------------------------------------------------------------------------

def _build_risk_score(sanctions_hit: bool, pep_exposure: bool,
                      country: str, industry: str, num_directors: int) -> float:
    """Calculate a deterministic risk score based on AML factors."""
    score = 0.1
    if sanctions_hit:
        score += 0.8
    if pep_exposure:
        score += 0.4
    if country in TAX_HAVENS:
        score += 0.3
    if industry in HIGH_RISK_INDUSTRIES:
        score += 0.2
    if num_directors > 4:
        score += 0.15
    return min(round(score, 2), 1.0)


def _risk_label_from_score(score: float) -> str:
    if score >= 0.7:
        return "HIGH"
    if score >= 0.4:
        return "MEDIUM"
    return "LOW"


def _risk_explanation(sanctions_hit: bool, pep_exposure: bool,
                      country: str, industry: str, num_directors: int) -> str:
    reasons = []
    if sanctions_hit:
        reasons.append("entity appears on sanctions lists")
    if pep_exposure:
        reasons.append("associated with Politically Exposed Persons")
    if country in TAX_HAVENS:
        reasons.append(f"registered in tax haven ({country})")
    if industry in HIGH_RISK_INDUSTRIES:
        reasons.append(f"operates in high-risk industry ({industry})")
    if num_directors > 4:
        reasons.append(f"unusually high number of directors ({num_directors})")
    if not reasons:
        return "No significant risk factors identified."
    return "Risk elevated due to: " + "; ".join(reasons) + "."


# ---------------------------------------------------------------------------
# Expense categories helper
# ---------------------------------------------------------------------------

EXPENSE_CATEGORY_NAMES = ["Healthcare", "Financial", "Software", "Entertainment",
                           "Logistics", "Marketing", "Legal", "HR"]


def _build_expense_categories() -> dict:
    """Generate a random set of expense categories summing to exactly 100."""
    num_cats = random.randint(3, 6)
    cats = random.sample(EXPENSE_CATEGORY_NAMES, num_cats)
    # Random partitioning that sums to 100
    cuts = sorted(random.sample(range(1, 100), num_cats - 1))
    parts = [cuts[0]] + [cuts[i] - cuts[i - 1] for i in range(1, num_cats - 1)] + [100 - cuts[-1]]
    return dict(zip(cats, parts))


# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def generate_random_company() -> dict:
    """Return a plain dict representing one randomly-generated company."""
    prefix = random.choice(PREFIXES)
    suffix = random.choice(SUFFIXES)
    company_name = f"{prefix} {suffix}"
    registration_number = f"RO{random.randint(10_000_000, 99_999_999)}"

    country = random.choice(COUNTRIES)
    street = random.choice(STREETS)
    address = f"{street} {random.randint(1, 200)}, {country}"
    status = random.choice(STATUSES)

    entity_type = random.choice(ENTITY_TYPES)
    industry = random.choice(INDUSTRIES)

    # Directors: 1 to 6 unique names
    num_directors = random.randint(1, 6)
    directors = random.sample(DIRECTOR_NAMES, num_directors)

    # AML factors
    days_ago = random.randint(365, 30 * 365)  # 1–30 years old
    incorporation_date = datetime.utcnow() - timedelta(days=days_ago)
    sanctions_hit = random.random() < 0.10   # 10% probability
    pep_exposure = random.random() < 0.15    # 15% probability

    # Risk engine
    risk_score = _build_risk_score(sanctions_hit, pep_exposure,
                                   country, industry, num_directors)
    risk_label = _risk_label_from_score(risk_score)
    risk_explanation = _risk_explanation(sanctions_hit, pep_exposure,
                                         country, industry, num_directors)

    # Financial data
    revenue = round(random.uniform(50_000, 5_000_000), 2)
    spend_fraction = random.uniform(0.30, 0.80)
    average_monthly_spend = round(revenue * spend_fraction / 12, 2)

    expense_categories = _build_expense_categories()
    budget_breakdown = {
        "need": random.randint(40, 60),
        "want": random.randint(20, 35),
        "save": 0,  # placeholder, calculated below
    }
    budget_breakdown["save"] = 100 - budget_breakdown["need"] - budget_breakdown["want"]

    return {
        "company_name": company_name,
        "registration_number": registration_number,
        "country": country,
        "address": address,
        "status": status,
        "entity_type": entity_type,
        "industry": industry,
        "directors": json.dumps(directors),
        "incorporation_date": incorporation_date,
        "sanctions_hit": sanctions_hit,
        "pep_exposure": pep_exposure,
        "risk_score": risk_score,
        "risk_label": risk_label,
        "risk_explanation": risk_explanation,
        "revenue": revenue,
        "average_monthly_spend": average_monthly_spend,
        "expense_categories": json.dumps(expense_categories),
        "budget_breakdown": json.dumps(budget_breakdown),
    }


# ---------------------------------------------------------------------------
# Database insertion
# ---------------------------------------------------------------------------

def populate_db(count: int = 50) -> None:
    """Insert `count` randomly-generated CompanyProfile records into the DB."""
    db = SessionLocal()
    try:
        for _ in range(count):
            data = generate_random_company()
            company = CompanyProfile(**data)
            db.add(company)
        db.commit()
        print(f"✅  Successfully inserted {count} mock company records.")
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        print(f"❌  Error inserting records: {exc}")
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    populate_db()
