import json
import pytest
from unittest.mock import MagicMock, patch
from sqlalchemy.orm import Session

from agent_core import AnalystAgent, Orchestrator
from models import CompanyProfile

class TestRAGIntegration:
    """
    Verify that the AnalystAgent retrieves historical context from the Vector Store (Qdrant)
    before calling the LLM.
    """

    COMPANY_DATA = {
        "name": "Acme Corp",
        "registration_number": "RO123456",
        "country": "RO"
    }

    @patch("agent_core.VectorStoreClient")
    @patch("agent_core.call_llm")
    def test_analyst_agent_queries_vector_store(self, mock_call_llm, mock_vector_client_class):
        """
        AnalystAgent.analyse() must call search() on the VectorStoreClient.
        """
        mock_vector_client = mock_vector_client_class.return_value
        mock_vector_client.search.return_value = [
            {"id": "prev-1", "score": 0.9, "payload": {"company_name": "Old Acme", "risk_score": 10}}
        ]
        
        # We need to mock call_llm to return a valid result so the code doesn't crash
        mock_call_llm.return_value = json.dumps({
            "company_name": "Acme Corp",
            "risk_score": 20,
            "risk_level": "LOW",
            "chain_of_thought": "Test reasoning.",
            "recommended_action": "Approve"
        })

        agent = AnalystAgent()
        agent.analyse(self.COMPANY_DATA)

        # Assert search was called on the vector client
        assert mock_vector_client.search.called, "AnalystAgent should query the vector store for context."

class TestDatabaseWiring:
    """
    Verify that the analysis results are saved to the PostgreSQL database.
    """

    @patch("agent_core.fetch_company_data")
    @patch("agent_core.AnalystAgent.analyse")
    def test_orchestrator_saves_to_db(self, mock_analyse, mock_fetch, db_session: Session):
        """
        Orchestrator.run() should create a CompanyProfile entry in the database.
        """
        mock_fetch.return_value = {"name": "Test DB Corp", "registration_number": "DB999", "country": "US"}
        
        from agent_core import AnalystResponse
        mock_analyse.return_value = AnalystResponse(
            company_name="Test DB Corp",
            risk_score=50,
            risk_level="MEDIUM",
            chain_of_thought="Middle of the road.",
            recommended_action="Review"
        )

        orchestrator = Orchestrator()
        # We might need to pass the db session to run() or have it use a dependency
        # For now, let's assume it handles its own session or we patch its session factory
        with patch("main.SessionLocal", return_value=db_session):
            orchestrator.run("Analyse Test DB Corp")

        # Verify the record exists in the DB
        profile = db_session.query(CompanyProfile).filter_by(company_name="Test DB Corp").first()
        assert profile is not None
        assert profile.risk_score == 50
        assert profile.risk_label == "MEDIUM"
