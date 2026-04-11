from typing import Dict, Type
from backend.agents.base_agent import BaseNodeAgent
from backend.agents.orchestrator_nodes import (
    UploadAgent, PlanningNodeAgent, ParserAgent, ClauseSplitterAgent,
    PolicyCheckingAgent, RiskAssessmentAgent, MCPRetrievalAgent,
    RedlineAgent, GovernanceAgent, HumanReviewAgent, OutputAgent, AuditorNodeAgent
)

class AgentRegistry:
    """Registry for managing and instantiating agent nodes (SOLID: Factory/Registry pattern)."""
    
    _agents: Dict[str, Type[BaseNodeAgent]] = {
        "upload": UploadAgent,
        "planning": PlanningNodeAgent,
        "parser": ParserAgent,
        "splitter": ClauseSplitterAgent,
        "policy_checking": PolicyCheckingAgent,
        "risk_assessment": RiskAssessmentAgent,
        "mcp_retrieval": MCPRetrievalAgent,
        "redline_generation": RedlineAgent,
        "governance": GovernanceAgent,
        "human_review": HumanReviewAgent,
        "auditor": AuditorNodeAgent,
        "output": OutputAgent
    }

    @classmethod
    def get_agent(cls, node_name: str) -> BaseNodeAgent:
        """Returns an instance of the requested agent node."""
        agent_class = cls._agents.get(node_name)
        if not agent_class:
            raise ValueError(f"Agent for node '{node_name}' not found in registry.")
        return agent_class()
