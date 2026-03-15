import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import MagicMock
import json
from generate_mock_data import generate_random_company, populate_db
from models import CompanyProfile

def test_generate_random_company_has_all_attributes():
    """
    Test that the generated company has all the required financial
    and OSINT attributes correctly populated.
    """
    company = generate_random_company()
    
    # Needs to be a valid CompanyProfile instance
    assert isinstance(company, CompanyProfile)
    
    # Financial fields should not be None
    assert company.revenue is not None
    assert company.average_monthly_spend is not None
    assert company.expense_categories is not None
    assert company.budget_breakdown is not None
    
    # Expense categories should be valid JSON
    expenses = json.loads(company.expense_categories)
    assert isinstance(expenses, dict)
    
def test_populate_db_inserts_records():
    """
    Test that populate_db commits the generated companies to the provided DB session.
    """
    mock_session = MagicMock()
    
    # Act
    # We expect populate_db to take a db session argument to be testable
    # This will FAIL (RED) because populate_db currently does not accept db_session
    populate_db(num_companies=5, db_session=mock_session)
    
    # Assert
    assert mock_session.add_all.called
    assert mock_session.commit.called
    
    # Verify exactly 5 were added
    args, kwargs = mock_session.add_all.call_args
    added_items = args[0]
    assert len(added_items) == 5
    assert all(isinstance(item, CompanyProfile) for item in added_items)
