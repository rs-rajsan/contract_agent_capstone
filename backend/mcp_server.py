import json
import logging
from typing import Any, Dict, List, Optional
from fastmcp import FastMCP

from backend.infrastructure.policy_repository import PolicyRepository
from backend.infrastructure.contract_repository import Neo4jContractRepository
from backend.agents.enhanced_cuad_tools import EnhancedPrecedentMatcherTool
from backend.mcp.decorators import mcp_tool_wrapper
from backend.shared.utils.mcp_logger import get_mcp_logger

# Initialize FastMCP server
mcp = FastMCP("ContractIntelligence")
logger = get_mcp_logger()

# Repositories (SOLID: Lazy loading to avoid side-effects on import)
_policy_repo = None
_contract_repo = None
_precedent_matcher = None

def get_policy_repo():
    global _policy_repo
    if _policy_repo is None:
        _policy_repo = PolicyRepository()
    return _policy_repo

def get_contract_repo():
    global _contract_repo
    if _contract_repo is None:
        _contract_repo = Neo4jContractRepository()
    return _contract_repo

def get_precedent_matcher():
    global _precedent_matcher
    if _precedent_matcher is None:
        _precedent_matcher = EnhancedPrecedentMatcherTool()
    return _precedent_matcher

@mcp.tool()
@mcp_tool_wrapper
async def search_clause_library(query: str, tenant_id: str) -> str:
    """
    Search the centralized clause library for legal language matching the query.
    Returns highly relevant clauses for building or reviewing contracts.
    
    Args:
        query: Semantic search query for the clause library.
        tenant_id: Mandatory tenant identifier for data isolation.
        
    Returns:
        JSON string containing 'success', 'results_count', and 'clauses'.
    """
    try:
        results = get_policy_repo().search_policies_semantic(query, tenant_id)
        return json.dumps({
            "success": True,
            "results_count": len(results),
            "clauses": results,
            "status": "completed"
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "status": "failed"})

@mcp.tool()
@mcp_tool_wrapper
async def get_playbook_rule(tenant_id: str, contract_type: str = "general") -> str:
    """
    Retrieve applicable legal playbook rules and corporate policies for a specific contract type.
    Use this to understand the 'Guardrails' or 'Standard Positions' for a contract.
    
    Args:
        tenant_id: Mandatory tenant identifier for data isolation.
        contract_type: The type of contract (e.g., 'MSA', 'SOW', 'NDA').
        
    Returns:
        JSON string containing 'success' and 'rules'.
    """
    try:
        rules = get_policy_repo().get_applicable_policies(tenant_id, contract_type)
        return json.dumps({
            "success": True,
            "contract_type": contract_type,
            "rules_count": len(rules),
            "rules": [
                {
                    "id": r.id,
                    "text": r.rule_text,
                    "severity": r.severity,
                    "type": r.rule_type
                } for r in rules
            ],
            "status": "completed"
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "status": "failed"})

@mcp.tool()
@mcp_tool_wrapper
async def search_prior_approved_clauses(clause_text: str, tenant_id: str) -> str:
    """
    Search historical metadata for previously approved clauses that match the provided text.
    Helpful for finding standard language and approval rates.
    
    Args:
        clause_text: The content of the clause to find precedents for.
        tenant_id: Mandatory tenant identifier for data isolation.
        
    Returns:
        JSON string containing 'success' and 'precedent_matches'.
    """
    try:
        clauses_input = json.dumps([{"clause_type": "unknown", "content": clause_text}])
        results_json = get_precedent_matcher()._run(clauses_input, tenant_id=tenant_id)
        results = json.loads(results_json)
        
        return json.dumps({
            "success": True,
            "tenant_id": tenant_id,
            "precedent_matches": results,
            "status": "completed"
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "status": "failed"})

@mcp.tool()
@mcp_tool_wrapper
async def fetch_contract_metadata(contract_id: str, tenant_id: str) -> str:
    """
    Retrieve structured metadata for a specific contract by its ID.
    
    Args:
        contract_id: The unique identifier for the contract (e.g., UPLOADED_XXXX).
        tenant_id: Mandatory tenant identifier for data isolation.
        
    Returns:
        JSON string containing 'success' and 'metadata'.
    """
    try:
        metadata = get_contract_repo().get_contract_by_id(contract_id, tenant_id=tenant_id)
        if not metadata:
            return json.dumps({"success": False, "error": f"Contract {contract_id} not found for tenant {tenant_id}", "status": "not_found"})
            
        return json.dumps({
            "success": True,
            "metadata": metadata,
            "status": "completed"
        })
    except Exception as e:
        return json.dumps({"success": False, "error": str(e), "status": "failed"})

if __name__ == "__main__":
    import os
    port = int(os.environ.get("MCP_PORT", "8100"))
    transport = os.environ.get("MCP_TRANSPORT", "stdio")
    
    if transport == "http":
        logger.info(f"Starting MCP Server on port {port} via HTTP")
        mcp.run("http", port=port)
    else:
        # Default to stdio for agent-to-agent communication
        logger.info("Starting MCP Server via stdio")
        mcp.run()
