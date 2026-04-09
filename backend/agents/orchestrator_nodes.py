import json
from datetime import datetime
from typing import Dict, Any, List
from langgraph.types import interrupt

from backend.agents.base_agent import BaseNodeAgent
from backend.agents.intelligence_state import IntelligenceState
from backend.agents.agent_workflow_tracker import workflow_tracker
from backend.infrastructure.audit_logger import AuditEventType
from backend.infrastructure.text_extractors import TextExtractionService
from backend.shared.utils.logger import get_logger, hallucination_flag_var
from backend.agents.intelligence_tools import ClauseDetectorTool, PolicyCheckerTool, RiskCalculatorTool, RedlineGeneratorTool
from backend.validation.cuad_validator import validate_cuad_analysis
from backend.infrastructure.mcp_client import mcp_client
from backend.shared.compliance_service import compliance_service
from backend.agents.planning.planning_agent import PlanningAgentFactory

class UploadAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Upload Agent", AuditEventType.DOCUMENT_UPLOAD)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Initialize contract review workflow and metadata",
            f"Input text length: {len(state.get('contract_text', ''))}"
        )
        
        metadata = {
            "ingestion_timestamp": datetime.now().isoformat(),
            "source_type": "upload",
            "initial_risk_score": 0
        }
        
        state = {**state, "metadata": metadata, "current_step": "upload"}
        compliance_status = self._log_and_check_compliance(state, "upload")
        
        workflow_tracker.complete_agent(execution, "Metadata initialized")
        return {**state, "compliance_status": compliance_status}

class PlanningNodeAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Planning Agent", AuditEventType.ANALYSIS_REQUEST)
        self.planner = PlanningAgentFactory.create_planning_agent()

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Analyze query and generate autonomous execution plan",
            "Initial state + contract text"
        )
        
        # Analyze current state to decide on strategy
        query = state.get("metadata", {}).get("query", "Analyze this contract for risk and compliance.")
        plan = self.planner.create_execution_plan(query)
        
        # Convert plan to dict for storage
        plan_dict = {
            "plan_id": plan.plan_id,
            "strategy": plan.strategy.value,
            "steps_count": len(plan.steps),
            "estimated_duration": plan.estimated_duration,
            "confidence_score": plan.confidence_score
        }
        
        state = {**state, "metadata": {**state.get("metadata", {}), "execution_plan": plan_dict}, "current_step": "planning"}
        compliance_status = self._log_and_check_compliance(state, "planning")
        
        workflow_tracker.complete_agent(execution, f"Created {plan.strategy.value} plan with {len(plan.steps)} steps")
        return {**state, "compliance_status": compliance_status}

class ParserAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Parser Agent", AuditEventType.ANALYSIS_REQUEST)
        self.extraction_service = TextExtractionService()

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Clean and structure contract text using extraction service",
            "Raw contract text"
        )
        
        file_path = (state.get("metadata") or {}).get("file_path")
        try:
            if file_path:
                cleaned_text = self.extraction_service.extract_with_fallback(file_path)
            else:
                cleaned_text = state.get("contract_text", "").strip()
        except Exception:
            cleaned_text = state.get("contract_text", "").strip()
            
        state = {**state, "contract_text": cleaned_text, "current_step": "parser"}
        compliance_status = self._log_and_check_compliance(state, "parser")
        
        workflow_tracker.complete_agent(execution, f"Parsed {len(cleaned_text)} characters")
        return {**state, "compliance_status": compliance_status}

class ClauseSplitterAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Clause Splitter Agent", AuditEventType.ANALYSIS_REQUEST)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        text_len = len(state.get("contract_text", ""))
        execution = workflow_tracker.start_agent(
            self.agent_name, 
            "Identify and split key contract clauses",
            f"Parsed text ({text_len:,} characters)"
        )
        
        try:
            tool = ClauseDetectorTool()
            clauses_json = tool._run(state.get("contract_text", ""))
            clauses_list = json.loads(clauses_json)
            
            state = {**state, "extracted_clauses": clauses_list, "current_step": "splitter"}
            compliance_status = self._log_and_check_compliance(state, "splitter")
            
            workflow_tracker.complete_agent(execution, f"Extracted {len(clauses_list)} clauses")
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Clause splitting failed: {e}")
            return {**state, "extracted_clauses": [], "processing_result": {"status": "error", "error": str(e)}}

class PolicyCheckingAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Policy Compliance Agent", AuditEventType.ANALYSIS_REQUEST)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        clause_count = len(state.get("extracted_clauses", []))
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Check clauses against company policies",
            f"{clause_count} extracted clauses"
        )
        
        try:
            tool = PolicyCheckerTool()
            clauses_json = json.dumps(state.get("extracted_clauses", []))
            violations_json = tool._run(clauses_json)
            violations_list = json.loads(violations_json)
            
            state = {**state, "policy_violations": violations_list, "current_step": "policy_checking"}
            compliance_status = self._log_and_check_compliance(state, "policy_checking")
            
            critical_count = len([v for v in violations_list if v.get("severity") == "CRITICAL"])
            workflow_tracker.complete_agent(execution, f"Found {len(violations_list)} violations ({critical_count} critical)")
            
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Policy checking failed: {e}")
            return {**state, "policy_violations": [], "current_step": "policy_checking"}

class RiskAssessmentAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Risk Assessment Agent", AuditEventType.ANALYSIS_REQUEST)
        from backend.agents.optimized_cuad_tools import OptimizedDeviationDetectorTool
        self.deviation_tool = OptimizedDeviationDetectorTool()

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        violation_count = len(state.get("policy_violations", []))
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Calculate overall risk score and detect legal deviations",
            f"{len(state.get('extracted_clauses', []))} clauses + {violation_count} violations"
        )
        
        try:
            clauses_json = json.dumps(state.get("extracted_clauses", []))
            deviations_json = self.deviation_tool._run(clauses_json)
            deviations_list = json.loads(deviations_json)
            
            tool = RiskCalculatorTool()
            violations_json = json.dumps(state.get("policy_violations", []))
            risk_json = tool._run(clauses_json, violations_json)
            risk_dict = json.loads(risk_json)
            
            risk_dict["legal_deviations"] = deviations_list
            risk_dict["deviation_count"] = len(deviations_list)
            
            state = {**state, "risk_data": risk_dict, "current_step": "risk_assessment"}
            compliance_status = self._log_and_check_compliance(state, "risk_assessment")
            
            workflow_tracker.complete_agent(execution, f"Risk Score: {risk_dict.get('overall_risk_score', 0)}/100")
            
            # Set hallucination flag for KPIs if confidence is low
            validation_result = validate_cuad_analysis({
                "clauses": state.get("extracted_clauses", []),
                "cuad_deviations": deviations_list,
                "risk_assessment": risk_dict,
                "policy_violations": state.get("policy_violations", [])
            })
            
            if validation_result.confidence_score < 0.7:
                hallucination_flag_var.set(True)
                get_logger(__name__).warning(f"Potential hallucination detected: confidence_score={validation_result.confidence_score:.2f}")
            else:
                hallucination_flag_var.set(False)

            return {**state, "compliance_status": compliance_status, "validation_result": validation_result}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Risk calculation failed: {e}")
            return {**state, "risk_data": {"overall_risk_score": 50.0, "risk_level": "MEDIUM"}}

class MCPRetrievalAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("MCP Retrieval Agent", AuditEventType.SEARCH_QUERY)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Retrieve specialized legal context via MCP",
            "Analyzing clauses"
        )
        
        try:
            tenant_id = (state.get("metadata") or {}).get("tenant_id", "demo_tenant_1")
            
            # Fetch precedents and rules synchronously via our new helper
            precedents_payload = json.dumps(state.get("extracted_clauses", [])[:5])
            precedents_result = mcp_client.call_tool_sync("search_prior_approved_clauses", {
                "clause_text": precedents_payload,
                "tenant_id": tenant_id
            })
            
            playbook_result = mcp_client.call_tool_sync("get_playbook_rule", {
                "tenant_id": tenant_id,
                "contract_type": state.get("metadata", {}).get("contract_type", "general")
            })
            
            mcp_data = {
                "retrieved_at": datetime.now().isoformat(),
                "source": "legal_mcp_server",
                "precedents": precedents_result.get("precedent_matches", []) if isinstance(precedents_result, dict) else [],
                "playbook_rules": playbook_result.get("rules", []) if isinstance(playbook_result, dict) else [],
                "tenant_id": tenant_id
            }
            
            state = {**state, "mcp_context": mcp_data, "current_step": "mcp_retrieval"}
            compliance_status = self._log_and_check_compliance(state, "mcp_retrieval")
            
            workflow_tracker.complete_agent(execution, f"Retrieved context via MCP")
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"MCP retrieval failed: {e}")
            return {**state, "mcp_context": {}, "current_step": "mcp_retrieval"}

class RedlineAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Redline Generation Agent", AuditEventType.DOCUMENT_UPDATE)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Generate contract redline suggestions",
            f"{len(state.get('policy_violations', []))} policy violations"
        )
        
        try:
            mcp_context = state.get("mcp_context") or {}
            redline_input = {
                "violations": state.get("policy_violations", []),
                "playbook_rules": mcp_context.get("playbook_rules", []),
                "tenant_id": mcp_context.get("tenant_id")
            }
            
            tool = RedlineGeneratorTool()
            redlines_json = tool._run(json.dumps(redline_input))
            redlines_list = json.loads(redlines_json)
            
            state = {**state, "redline_suggestions": redlines_list, "current_step": "redline_generation"}
            compliance_status = self._log_and_check_compliance(state, "redline_generation")
            
            workflow_tracker.complete_agent(execution, f"Generated {len(redlines_list)} redlines")
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Redline generation failed: {e}")
            return {**state, "redline_suggestions": [], "is_complete": True}

class GovernanceAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Governance Agent", AuditEventType.ANALYSIS_REQUEST)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Perform automated regulatory compliance checks",
            "Full intelligence state"
        )
        
        hipaa_result = compliance_service.check_hipaa_compliance(state.get("contract_text", ""))
        fhir_mapping = compliance_service.map_to_fhir(state.get("extracted_clauses", []))
        
        metadata = state.get("metadata") or {}
        workflow_id = metadata.get("ingestion_timestamp", "unknown")
        sox_audit = compliance_service.generate_sox_audit_trail({
            "workflow_id": workflow_id,
            "estimated_value": state.get("risk_data", {}).get("financial_impact", "LOW")
        })

        compliance_status = {
            "hipaa": hipaa_result,
            "fhir": fhir_mapping,
            "sox": sox_audit,
            "overall_status": "PASS" if hipaa_result.get("status") == "PASS" else "FLAGGED"
        }
        
        state = {**state, "compliance_status": compliance_status, "current_step": "governance"}
        
        # NEW: Check if refinement is needed based on policy violations
        refinement_needed = any(v.get("severity") == "CRITICAL" for v in state.get("policy_violations", []))
        state["refinement_needed"] = refinement_needed
        
        workflow_tracker.complete_agent(execution, f"Compliance check: {compliance_status['overall_status']}, Refinement: {refinement_needed}")
        return state

class HumanReviewAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Human Review Agent", AuditEventType.ANALYSIS_REQUEST)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        # Check if human review is needed based on governance/risk
        is_risky = state.get("risk_data", {}).get("overall_risk_score", 0) > 70
        is_flagged = state.get("compliance_status", {}).get("overall_status") == "FLAGGED"
        is_critical = any(v.get("severity") == "CRITICAL" for v in state.get("policy_violations", []))
        
        needs_review = is_risky or is_flagged or is_critical
        
        if needs_review:
            logger_info = f"⚠️ HUMAN REVIEW REQUIRED: Risk({is_risky}), Flagged({is_flagged}), Critical({is_critical})"
            from backend.shared.utils.logger import get_logger
            get_logger(__name__).info(logger_info)
            
            # Update state for HITL tracking
            state["human_review_required"] = True
            state["paused_at"] = datetime.now().isoformat()
            state["current_step"] = "human_review"
            
            # LANGGRAPH HITL: This will pause execution and return to the caller
            # The caller must provide 'review_decision' to resume
            review_input = interrupt({
                "reason": "High risk or compliance flags detected",
                "risk_score": state.get("risk_data", {}).get("overall_risk_score"),
                "violations": state.get("policy_violations", [])
            })
            
            # Capture human feedback from the interrupt return value
            state["metadata"]["human_feedback"] = review_input
            state["human_review_required"] = False # Mark as reviewed
            
            return state
        
        return {**state, "human_review_required": False, "current_step": "human_review"}

class OutputAgent(BaseNodeAgent):
    def __init__(self):
        super().__init__("Output Agent", AuditEventType.ANALYSIS_REQUEST)

    def execute(self, state: IntelligenceState) -> IntelligenceState:
        execution = workflow_tracker.start_agent(
            self.agent_name,
            "Finalize contract review report",
            "Full analysis state"
        )
        
        workflow_tracker.complete_agent(execution, "Report finalized")
        return {**state, 
            "is_complete": True, 
            "current_step": "output",
            "processing_result": {"status": "success", "message": "Full Agentic review completed"}
        }
