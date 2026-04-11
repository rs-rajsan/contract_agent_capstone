from typing import TypedDict, List, Any
from backend.domain.value_objects import ProcessingResult

class IntelligenceState(TypedDict):
    """Properly designed state following SRP - data separate from workflow"""
    
    # Input data
    contract_text: str
    metadata: dict  # NEW: For upload/parser metadata
    
    # Processing results (structured data, not strings)
    extracted_clauses: List[dict]
    policy_violations: List[dict] 
    risk_data: dict
    redline_suggestions: List[dict]
    
    # CUAD mitigation results (Phase 1 extension)
    cuad_deviations: List[dict]
    jurisdiction_info: dict
    precedent_matches: List[dict]
    
    # Pattern analysis results (NEW)
    pattern_used: str
    pattern_analysis: dict
    
    # Compliance results (NEW)
    compliance_status: dict  # HIPAA, FHIR, SOX results
    mcp_context: dict       # Data retrieved via MCP
    
    # Workflow metadata
    messages: List[Any]
    current_step: str
    processing_result: ProcessingResult
    validation_result: dict      # NEW: For Auditor Agent reflections
    human_review_required: bool  # NEW: For HITL
    refinement_needed: bool      # NEW: For governance refinement loops
    paused_at: str               # NEW: Timestamp of HITL interruption
    is_complete: bool