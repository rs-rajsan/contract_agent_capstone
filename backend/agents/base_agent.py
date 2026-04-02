from typing import Dict, Any
from abc import ABC, abstractmethod
from backend.agents.intelligence_state import IntelligenceState
from backend.agents.agent_workflow_tracker import workflow_tracker
from backend.infrastructure.audit_logger import AuditLogger, AuditEventType
from backend.shared.compliance_service import compliance_service

class BaseNodeAgent(ABC):
    """Base class for all orchestrator nodes following SOLID principles."""
    
    def __init__(self, agent_name: str, audit_event: AuditEventType):
        self.agent_name = agent_name
        self.audit_event = audit_event
        self.audit_logger = AuditLogger()

    def _log_and_check_compliance(self, state: IntelligenceState, stage_name: str) -> Dict[str, Any]:
        """Shared logic for stage-wise compliance and auditability."""
        metadata = state.get("metadata") or {}
        resource_id = metadata.get("ingestion_timestamp", "unknown")
        
        # 1. Structured Audit Log (SOX compliance)
        audit_metadata = {
            "stage": stage_name, 
            "current_step": state.get("current_step"), 
            "is_complete": state.get("is_complete")
        }
        # Include document metadata for transparency and masking verification
        if metadata:
            audit_metadata.update(metadata)
            
        self.audit_logger.log_event(
            event_type=self.audit_event,
            resource_id=resource_id,
            action=f"AGENT_STAGE_{stage_name.upper()}",
            metadata=audit_metadata
        )
        
        # 2. Stage-wise HIPAA Check (PHI detection)
        hipaa_result = compliance_service.check_hipaa_compliance(state.get("contract_text", ""))
        
        current_compliance = dict(state.get("compliance_status") or {})
        current_compliance[stage_name] = hipaa_result
        if hipaa_result.get("status") == "FLAGGED":
            current_compliance["overall_status"] = "FLAGGED"
            
        return current_compliance

    @abstractmethod
    def execute(self, state: IntelligenceState) -> IntelligenceState:
        """Core execution logic for the agent node."""
        pass
