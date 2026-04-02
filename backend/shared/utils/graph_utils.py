import os
from langchain_neo4j import Neo4jGraph
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

_graph_instance = None

def get_graph() -> Neo4jGraph:
    """Lazy initialization of Neo4jGraph to prevent startup crashes."""
    global _graph_instance
    if _graph_instance is None:
        try:
            # Check for required environment variables
            if not os.getenv("NEO4J_URI"):
                logger.warning("NEO4J_URI not set. Neo4j connectivity will be disabled.")
                return _create_dummy_graph()

            _graph_instance = Neo4jGraph(
                refresh_schema=False, 
                driver_config={"notifications_min_severity": "OFF"}
            )
            logger.info("Successfully connected to Neo4j")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            return _create_dummy_graph()
    return _graph_instance

def _create_dummy_graph():
    """Create a dummy graph object that raises useful errors instead of crashing."""
    class DummyGraph:
        def query(self, *args, **kwargs):
            logger.error("Neo4j Query Attempted: Database is currently unreachable.")
            raise RuntimeError("Neo4j is currently unreachable. Check your connection settings.")
    return DummyGraph()
