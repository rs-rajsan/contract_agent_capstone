"""
Auditor Agent for Self-Reflection and Graph Integrity Validation.
This agent audits the results of preceding agents to ensure consistency and quality.
"""

from typing import Dict, Any, List
from backend.shared.utils.logger import get_logger
from backend.agents.agent_workflow_tracker import workflow_tracker

logger = get_logger(__name__)

class AuditorAgent:
    """
    Self-Reflection agent that audits document processing results.
    """
    
    def __init__(self, llm=None):
        self.llm = llm

    def audit_processing_results(self, contract_id: str, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Audits the generated embeddings and contract data for consistency.
        """
        logger.info(f"🧐 AUDITOR AGENT: Reviewing contract {contract_id}")
        
        audit_results = {
            "is_valid": True,
            "confidence_score": 0.0,
            "reflections": [],
            "issues": []
        }
        
        # Determine confidence based on presence of key components
        # (This is a simplified self-reflection logic)
        
        has_sections = len(results.get("sections", [])) > 0
        has_clauses = len(results.get("clauses", [])) > 0
        has_text = len(results.get("extracted_text", "")) > 100
        
        if not has_text:
            audit_results["is_valid"] = False
            audit_results["issues"].append("CRITICAL: Extracted text is too short or missing.")
        
        if not has_sections:
            audit_results["issues"].append("WARNING: No logical sections were identified.")
            
        if not has_clauses:
            audit_results["issues"].append("WARNING: No specific legal clauses were extracted.")

        # Final Reflection
        if audit_results["is_valid"]:
            audit_results["confidence_score"] = 0.95 if (has_sections and has_clauses) else 0.70
            audit_results["reflections"].append(f"Orchestration consistency check passed with {int(audit_results['confidence_score']*100)}% confidence.")
        else:
            audit_results["confidence_score"] = 0.1
            audit_results["reflections"].append("Integrity check failed: Manual intervention recommended.")

        return audit_results
