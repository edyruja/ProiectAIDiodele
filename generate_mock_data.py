import json
import random
from database import SessionLocal, engine, Base
from models import CompanyProfile

# Ne asigurăm că tabelele există
Base.metadata.create_all(bind=engine)

# 1. Liste cu date fictive (Building blocks)
PREFIXES = ["Global", "Apex", "Meridian", "Quantum", "Nexus", "Transilvania", "Euro", "Vanguard", "Oceanic", "Stellar"]
SUFFIXES = ["Ltd.", "GmbH", "SA", "SRL", "Holdings", "Corp", "Inc.", "Trading", "Logistics", "Shell"]
COUNTRIES = ["Cayman Islands", "Romania", "Germany", "Cyprus", "UAE", "UK", "Panama", "Switzerland", "BVI"]
STATUSES = ["active", "active", "active", "dissolved", "suspended"] # Mai multe șanse să fie 'active'
DIRECTOR_NAMES = [
    "Ivan Volkov", "John Doe", "Jane Smith", "Ioan Popa", "Maria Ionescu", 
    "Andrei Popescu", "Carlos Santana", "Corporate Nominee 1", "Trustee Corp A", 
    "Elena Radu", "Chen Wei", "Ali Hassan", "Nominee Director X"
]
STREETS = ["Secrecy Blvd", "Victoriei", "Piața Sfatului", "Wall Street", "Bahnhofstrasse", "Sheikh Zayed Road", "Offshore Way"]

INDUSTRIES = ["Real Estate", "Crypto", "Retail", "Logistics", "IT Services", "Manufacturing", "Finance", "Consulting"]
TAX_HAVENS = ["Cayman Islands", "Panama", "BVI", "Cyprus", "UAE"]

ENTITY_TYPES = ["SRL", "SA", "PFA", "ONG", "Persoană Fizică"]
EXPENSE_CATEGORIES = ["Healthcare", "Financial", "Software", "Entertainment", "Logistics", "Marketing", "HR", "Infrastructure"]


def _random_distribution(keys: list) -> dict:
    """Generate a random percentage split across `keys` that sums to 100."""
    raw = [random.uniform(1, 10) for _ in keys]
    total = sum(raw)
    percentages = [round(v / total * 100, 1) for v in raw]
    # Fix rounding drift so the sum is exactly 100
    diff = round(100 - sum(percentages), 1)
    percentages[0] = round(percentages[0] + diff, 1)
    return dict(zip(keys, percentages))

def generate_random_company():
    """Generează o singură companie cu date aleatorii, dar cu un scor de risc determinist."""
    country = random.choice(COUNTRIES)
    num_directors = random.randint(1, 6) # Între 1 și 6 directori pentru a testa NetworkGraph
    industry = random.choice(INDUSTRIES)
    
    # Probabilități mici pentru sancțiuni și PEP ca să fie realist (10% șanse)
    sanctions_hit = random.random() < 0.1
    pep_exposure = random.random() < 0.15
    
    incorporation_date = f"{random.randint(1990, 2024)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}"

    # Calcul determinist al scorului de risc
    risk_score = 0.1  # Base score
    rules_triggered = []

    if sanctions_hit:
        risk_score += 0.8
        rules_triggered.append("Hit pe listele de sancțiuni internaționale")
        
    if pep_exposure:
        risk_score += 0.4
        rules_triggered.append("Expunere la Persoane Expuse Politic (PEP)")
        
    if country in TAX_HAVENS:
        risk_score += 0.3
        rules_triggered.append(f"Jurisdicție cu risc ridicat: {country}")
        
    if industry in ["Crypto", "Real Estate"]:
        risk_score += 0.2
        rules_triggered.append(f"Industrie predispusă la spălare de bani: {industry}")
        
    if num_directors > 4:
        risk_score += 0.15
        rules_triggered.append(f"Structură complexă cu număr mare de directori ({num_directors})")

    # Limităm scorul la maxim 1.0 și minim 0.0
    risk_score = min(1.0, max(0.0, risk_score))
    risk_score = round(risk_score, 2)
    
    if risk_score >= 0.7:
        risk_label = "HIGH"
        prefix = "Risc RIDICAT."
    elif risk_score >= 0.4:
        risk_label = "MEDIUM"
        prefix = "Risc MEDIU."
    else:
        risk_label = "LOW"
        prefix = "Risc SCĂZUT."

    if not rules_triggered:
        explanation = f"{prefix} Entitate standard în {industry}, din {country}, fără alerte speciale pe OSINT."
    else:
        explanation = f"{prefix} Factori identificați: " + "; ".join(rules_triggered) + "."

    # --- Financial intelligence fields ---
    entity_type = random.choice(ENTITY_TYPES)
    revenue = round(random.uniform(50_000, 5_000_000), 2)
    # Monthly spend is a realistic fraction of annual revenue (4%–9% per month)
    spend_fraction = random.uniform(0.04, 0.09)
    average_monthly_spend = round(revenue * spend_fraction / 12, 2)

    # Pick 4 expense categories and split 100% among them
    chosen_categories = random.sample(EXPENSE_CATEGORIES, 4)
    expense_categories = _random_distribution(chosen_categories)

    # Need / Want / Save budget breakdown
    budget_breakdown = _random_distribution(["need", "want", "save"])

    return CompanyProfile(
        company_name=f"{random.choice(PREFIXES)} {random.choice(SUFFIXES)}",
        registration_number=f"REG-{random.randint(10000, 999999)}",
        country=country,
        status=random.choice(STATUSES),
        address=f"{random.randint(1, 999)} {random.choice(STREETS)}, {country}",
        directors=json.dumps(random.sample(DIRECTOR_NAMES, num_directors)),
        risk_score=risk_score,
        risk_label=risk_label,
        risk_explanation=explanation,
        industry=industry,
        incorporation_date=incorporation_date,
        sanctions_hit=sanctions_hit,
        pep_exposure=pep_exposure,
        entity_type=entity_type,
        revenue=revenue,
        average_monthly_spend=average_monthly_spend,
        expense_categories=json.dumps(expense_categories),
        budget_breakdown=json.dumps(budget_breakdown),
    )

def populate_db(num_companies=50, db_session=None):
    """Inserează un număr specificat de companii în baza de date."""
    db = db_session if db_session else SessionLocal()
    
    try:
        companies = [generate_random_company() for _ in range(num_companies)]
        db.add_all(companies)
        db.commit()
        print(f"✅ Am inserat cu succes {num_companies} de companii random în baza de date!")
    except Exception as e:
        db.rollback()
        print(f"❌ A apărut o eroare: {e}")
    finally:
        # Only close the session if we created it here (i.e. db_session was not provided)
        if db_session is None:
            db.close()

if __name__ == "__main__":
    # Aici poți schimba numărul de firme pe care vrei să le generezi
    populate_db(50)