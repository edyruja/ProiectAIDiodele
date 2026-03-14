"""
vector_store.py – Qdrant Vector Database integration layer.

Phase 3: Database Integration (Antigravity AML System)

Architecture:
    This module provides a MCP-ready (Model Context Protocol) wrapper around
    the Qdrant vector database.  By encapsulating all Qdrant operations behind
    VectorStoreClient, future phases can expose vector search as a standardised
    MCP tool without changing callers.

Configuration (environment variables):
    QDRANT_HOST     – Host URL for the Qdrant server.
                      Defaults to "localhost" for local development.
    QDRANT_PORT     – Port for gRPC/HTTP.  Defaults to 6333.
    QDRANT_API_KEY  – API key for Qdrant Cloud deployments (optional).

Usage:
    from vector_store import VectorStoreClient

    client = VectorStoreClient()
    client.upsert_vector(
        collection="company_embeddings",
        vector_id="company-abc-001",
        embedding=[0.1, 0.2, ..., 0.5],  # from LLM embedding model
        payload={"company_name": "Acme Corp", "country": "RO"},
    )
"""

import os
import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# ---------------------------------------------------------------------------
# Configuration – readable by tests via direct import
# ---------------------------------------------------------------------------

QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", None)


# ---------------------------------------------------------------------------
# VectorStoreClient
# ---------------------------------------------------------------------------

class VectorStoreClient:
    """
    Thin wrapper around QdrantClient that exposes a stable, MCP-compatible
    interface for the AI agents in Phase 5.

    MCP Tool Schema (future integration):
        Tool name   : vector_store
        Operations  : upsert_vector, search, delete_vector
        Description : Long-term semantic memory for AML investigation reports,
                      legal texts, and sanction list embeddings.
    """

    def __init__(self) -> None:
        """
        Initialise the Qdrant client.

        - Connects to QDRANT_HOST:QDRANT_PORT with optional API key.
        - In unit tests, QdrantClient is patched so no real server is needed.
        """
        self.client = QdrantClient(
            host=QDRANT_HOST,
            port=QDRANT_PORT,
            api_key=QDRANT_API_KEY,
        )

    # ------------------------------------------------------------------
    # Collection management
    # ------------------------------------------------------------------

    def ensure_collection(
        self,
        collection_name: str,
        vector_size: int,
        distance: Distance = Distance.COSINE,
    ) -> None:
        """
        Create a Qdrant collection if it does not already exist.

        Args:
            collection_name: Name of the collection (e.g. "company_embeddings").
            vector_size:     Dimension of the embedding vectors.
            distance:        Similarity metric.  Defaults to COSINE.
        """
        existing = {c.name for c in self.client.get_collections().collections}
        if collection_name not in existing:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=distance),
            )

    # ------------------------------------------------------------------
    # Vector operations
    # ------------------------------------------------------------------

    def upsert_vector(
        self,
        collection: str,
        vector_id: str,
        embedding: list[float],
        payload: dict[str, Any] | None = None,
    ) -> Any:
        """
        Insert or update a single vector point in the specified collection.

        Args:
            collection:  Target Qdrant collection name.
            vector_id:   Unique string identifier for this point.
                         Converted to a deterministic UUID internally.
            embedding:   Float list representing the embedding vector.
            payload:     Optional metadata dict stored alongside the vector.

        Returns:
            The Qdrant UpdateResult object (truthy on success).
        """
        # Qdrant requires UUID-compatible IDs; derive one from the string id
        point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, vector_id))

        result = self.client.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=point_uuid,
                    vector=embedding,
                    payload=payload or {},
                )
            ],
        )
        return result

    def search(
        self,
        collection: str,
        query_vector: list[float],
        top_k: int = 5,
        score_threshold: float | None = None,
    ) -> list[dict[str, Any]]:
        """
        Perform a semantic similarity search.

        Args:
            collection:      Collection to search.
            query_vector:    Embedding to search with.
            top_k:           Number of nearest neighbours to return.
            score_threshold: Minimum similarity score (optional).

        Returns:
            List of result dicts with keys: id, score, payload.
        """
        hits = self.client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=score_threshold,
        )
        return [
            {"id": str(hit.id), "score": hit.score, "payload": hit.payload}
            for hit in hits
        ]

    def delete_vector(self, collection: str, vector_id: str) -> Any:
        """
        Delete a point from a collection by its string ID.

        Returns:
            The Qdrant UpdateResult object.
        """
        point_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, vector_id))
        return self.client.delete(
            collection_name=collection,
            points_selector=[point_uuid],
        )

    # ------------------------------------------------------------------
    # MCP tool descriptors (Phase 5 integration hook)
    # ------------------------------------------------------------------

    @staticmethod
    def mcp_tool_definitions() -> list[dict[str, Any]]:
        """
        Returns OpenAI-style function/tool definitions for MCP integration.

        The Orchestrator Agent (Phase 5) will load these definitions and
        dispatch calls to upsert_vector / search accordingly.
        """
        return [
            {
                "name": "vector_store_search",
                "description": (
                    "Search the AML knowledge base for semantically similar past "
                    "investigations, sanctions, and legal precedents."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "collection": {
                            "type": "string",
                            "description": "Qdrant collection name to search",
                        },
                        "query_vector": {
                            "type": "array",
                            "items": {"type": "number"},
                            "description": "Embedding vector for the query",
                        },
                        "top_k": {
                            "type": "integer",
                            "description": "Number of results to return",
                            "default": 5,
                        },
                    },
                    "required": ["collection", "query_vector"],
                },
            },
            {
                "name": "vector_store_upsert",
                "description": (
                    "Store a new investigation report embedding in the AML knowledge base."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "collection": {"type": "string"},
                        "vector_id": {"type": "string"},
                        "embedding": {
                            "type": "array",
                            "items": {"type": "number"},
                        },
                        "payload": {"type": "object"},
                    },
                    "required": ["collection", "vector_id", "embedding"],
                },
            },
        ]
