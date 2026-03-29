from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from backend.agents.intelligence_state import IntelligenceState
from backend.agents.intelligence_tools import (
    ClauseDetectorTool, PolicyCheckerTool, 
    RiskCalculatorTool, RedlineGeneratorTool
)
from backend.agents.agent_workflow_tracker import workflow_tracker
from backend.agents.planning.planning_agent import PlanningAgentFactory
from backend.agents.planning.execution_engine import PlanExecutionEngine
import json
from datetime import datetime
from typing import Dict, Any

from backend.shared.utils.logger import get_logger
from backend.shared.compliance_service import compliance_service
from backend.infrastructure.text_extractors import TextExtractionService
from backend.infrastructure.mcp_client import mcp_client
from backend.infrastructure.audit_logger import AuditLogger, AuditEventType
logger = get_logger(__name__)

class IntelligenceOrchestrator:
    """Proper multi-agent orchestrator following SOLID principles"""
    
    def __init__(self, llm):
        self.llm = llm
        self.workflow = self._build_workflow()
        self.planning_agent = PlanningAgentFactory.create_planning_agent()
        self.execution_engine = PlanExecutionEngine()
        self.audit_logger = AuditLogger()
        self.extraction_service = TextExtractionService()
        
        # Integrate existing specialized CUAD tools (High reuse)
        from backend.agents.optimized_cuad_tools import (
            OptimizedDeviationDetectorTool,
            OptimizedJurisdictionAdapterTool,
            OptimizedPrecedentMatcherTool
        )
        self.deviation_tool = OptimizedDeviationDetectorTool()
        self.jurisdiction_tool = OptimizedJurisdictionAdapterTool()
        self.precedent_tool = OptimizedPrecedentMatcherTool()
    
    def _build_workflow(self) -> StateGraph:
        """Build standardized agentic workflow with compliance and HITL.
        
        Node sequence:
        upload → parser → splitter → policy_checking → risk_assessment
            → mcp_retrieval → redline_generation → governance
            → human_review → output → END
        """
        workflow = StateGraph(IntelligenceState)
        
        # Phase 1: Input & Parsing
        workflow.add_node("upload", self._upload_node)
        workflow.add_node("parser", self._parser_node)
        workflow.add_node("splitter", self._splitter_node)
        
        # Phase 2: Analysis & Intelligence
        workflow.add_node("policy_checking", self._check_policies)  # BUG-03 FIX: was orphaned
        workflow.add_node("risk_assessment", self._risk_node)
        workflow.add_node("mcp_retrieval", self._mcp_retrieval_node)
        workflow.add_node("redline_generation", self._redline_node)
        
        # Phase 3: Compliance & Governance
        workflow.add_node("governance", self._governance_node)
        
        # Phase 4: Human-in-the-Loop & Output
        workflow.add_node("human_review", self._human_review_node)
        workflow.add_node("output", self._output_node)
        
        # Define edges — full 10-node sequence
        workflow.set_entry_point("upload")
        workflow.add_edge("upload", "parser")
        workflow.add_edge("parser", "splitter")
        workflow.add_edge("splitter", "policy_checking")       # BUG-03 FIX: was splitter → risk_assessment
        workflow.add_edge("policy_checking", "risk_assessment")
        workflow.add_edge("risk_assessment", "mcp_retrieval")
        workflow.add_edge("mcp_retrieval", "redline_generation")
        workflow.add_edge("redline_generation", "governance")
        workflow.add_edge("governance", "human_review")
        workflow.add_edge("human_review", "output")
        workflow.add_edge("output", END)
        
        return workflow.compile()
    
    def _log_and_check_compliance(self, state: IntelligenceState, stage_name: str, event_type: AuditEventType) -> Dict[str, Any]:
        """Centralized helper for stage-wise compliance and auditability (DRY principle)."""
        # BUG-05/09 FIX: contract_id and workflow_id not in state — derive a stable resource ID from metadata
        metadata = state.get("metadata") or {}
        resource_id = metadata.get("ingestion_timestamp", "unknown")
        
        # 1. Structured Audit Log (SOX compliance)
        self.audit_logger.log_event(
            event_type=event_type,
            resource_id=resource_id,
            action=f"AGENT_STAGE_{stage_name.upper()}",
            metadata={"stage": stage_name, "current_step": state["current_step"], "is_complete": state["is_complete"]}
        )
        
        # 2. Stage-wise HIPAA Check (PHI detection)
        hipaa_result = compliance_service.check_hipaa_compliance(state["contract_text"])
        
        # BUG-08 FIX: Avoid in-place mutation of state dict — create a new copy
        current_compliance = dict(state.get("compliance_status") or {})
        current_compliance[stage_name] = hipaa_result
        if hipaa_result["status"] == "FLAGGED":
            current_compliance["overall_status"] = "FLAGGED"
            
        return current_compliance

    def _upload_node(self, state: IntelligenceState) -> IntelligenceState:
        """Handles document ingestion and metadata initialization."""
        execution = workflow_tracker.start_agent(
            "Upload Agent",
            "Initialize contract review workflow and metadata",
            f"Input text length: {len(state['contract_text'])}"
        )
        
        metadata = {
            "ingestion_timestamp": datetime.now().isoformat(),
            "source_type": "upload",
            "initial_risk_score": 0
        }
        
        state = {**state, "metadata": metadata, "current_step": "upload"}
        compliance_status = self._log_and_check_compliance(state, "upload", AuditEventType.DOCUMENT_UPLOAD)
        
        workflow_tracker.complete_agent(execution, "Metadata initialized")
        return {**state, "compliance_status": compliance_status}

    def _parser_node(self, state: IntelligenceState) -> IntelligenceState:
        """Parses document text using the TextExtractionService fallback strategy.
        
        BUG-06 NOTE: `file_path` is not in IntelligenceState. If a file path is available,
        callers should pass it in `state["metadata"]["file_path"]`; otherwise this node
        falls back to the pre-loaded `contract_text` string (e.g. from API upload).
        """
        execution = workflow_tracker.start_agent(
            "Parser Agent",
            "Clean and structure contract text using extraction service",
            "Raw contract text"
        )
        
        # Try filesystem extraction if a file_path was stored in metadata, else use buffer
        file_path = (state.get("metadata") or {}).get("file_path")
        try:
            if file_path:
                cleaned_text = self.extraction_service.extract_with_fallback(file_path)
            else:
                cleaned_text = state["contract_text"].strip()
        except Exception:  # BUG-07 FIX: replaced bare except with except Exception
            logger.warning("Extraction service failed; falling back to raw contract_text buffer.")
            cleaned_text = state["contract_text"].strip()
            
        state = {**state, "contract_text": cleaned_text, "current_step": "parser"}
        compliance_status = self._log_and_check_compliance(state, "parser", AuditEventType.ANALYSIS_REQUEST)
        
        workflow_tracker.complete_agent(execution, f"Parsed {len(cleaned_text)} characters")
        return {**state, "compliance_status": compliance_status}

    def _splitter_node(self, state: IntelligenceState) -> IntelligenceState:
        """Splits contract into distinct clauses with auditability."""
        text_len = len(state["contract_text"])
        execution = workflow_tracker.start_agent(
            "Clause Splitter Agent", 
            "Identify and split key contract clauses",
            f"Parsed text ({text_len:,} characters)"
        )
        
        try:
            tool = ClauseDetectorTool()
            clauses_json = tool._run(state["contract_text"])
            clauses_list = json.loads(clauses_json)
            
            state = {**state, "extracted_clauses": clauses_list, "current_step": "splitter"}
            compliance_status = self._log_and_check_compliance(state, "splitter", AuditEventType.ANALYSIS_REQUEST)
            
            workflow_tracker.complete_agent(execution, f"Extracted {len(clauses_list)} clauses")
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Clause splitting failed: {e}")
            return {**state, "extracted_clauses": [], "processing_result": {"status": "error", "error": f"Clause splitting failed: {e}"}}
    
    def _pattern_analysis(self, state: IntelligenceState) -> IntelligenceState:
        """Pattern-based analysis using ReACT or Chain-of-Thought"""
        from backend.agents.patterns.pattern_selector import PatternSelector
        from backend.agents.patterns.react_agent import ReACTAgent
        from backend.agents.patterns.chain_of_thought_agent import ChainOfThoughtAgent
        import asyncio
        
        # Select pattern based on complexity
        pattern = PatternSelector.select_pattern({
            'contract_text': state['contract_text'],
            'clauses': state['extracted_clauses'],
            'violations': state.get('policy_violations', [])
        })
        
        if pattern == "react":
            agent = ReACTAgent(max_iterations=3)
            result = asyncio.run(agent.execute({
                'contract_text': state['contract_text'],
                'clauses': state['extracted_clauses'],
                'contract_id': state.get('contract_id', 'unknown')
            }))
            
            return {**state,
                'pattern_analysis': result,
                'pattern_used': 'ReACT',
                'current_step': 'pattern_analysis'
            }
        
        elif pattern == "chain_of_thought":
            agent = ChainOfThoughtAgent()
            result = asyncio.run(agent.execute({
                'clauses': state['extracted_clauses'],
                'task_type': 'risk_assessment',
                'contract_id': state.get('contract_id', 'unknown')
            }))
            
            return {**state,
                'pattern_analysis': result,
                'pattern_used': 'Chain-of-Thought',
                'current_step': 'pattern_analysis'
            }
        
        # Standard workflow - no pattern
        logger.info("Using standard workflow, skipping pattern analysis")
        return {**state, 
            'pattern_used': 'Standard',
            'current_step': 'pattern_analysis'
        }
    
    def _check_policies(self, state: IntelligenceState) -> IntelligenceState:
        """Check clauses against company policies with stage-wise compliance audit (BUG-03 FIX: now wired into graph)."""
        clause_count = len(state["extracted_clauses"])
        execution = workflow_tracker.start_agent(
            "Policy Compliance Agent",
            "Check clauses against company policies (Payment, Liability, IP, etc.)",
            f"{clause_count} extracted clauses"
        )
        
        try:
            tool = PolicyCheckerTool()
            clauses_json = json.dumps(state["extracted_clauses"])
            violations_json = tool._run(clauses_json)
            violations_list = json.loads(violations_json)
            
            state = {**state, "policy_violations": violations_list, "current_step": "policy_checking"}
            compliance_status = self._log_and_check_compliance(state, "policy_checking", AuditEventType.ANALYSIS_REQUEST)
            
            critical_count = len([v for v in violations_list if v.get("severity") == "CRITICAL"])
            workflow_tracker.complete_agent(execution, f"Found {len(violations_list)} violations ({critical_count} critical)")
            
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Policy checking failed: {e}")
            return {**state, "policy_violations": [], "current_step": "policy_checking"}
    
    def _risk_node(self, state: IntelligenceState) -> IntelligenceState:
        """Calculate risks with integrated CUAD deviation detection."""
        violation_count = len(state["policy_violations"])
        execution = workflow_tracker.start_agent(
            "Risk Assessment Agent",
            "Calculate overall risk score and detect subtle legal deviations",
            f"{len(state['extracted_clauses'])} clauses + {violation_count} violations"
        )
        
        try:
            # 1. Reuse existing specialized logic: Detect subtle legal deviations (CUAD)
            clauses_json = json.dumps(state["extracted_clauses"])
            deviations_json = self.deviation_tool._run(clauses_json)
            deviations_list = json.loads(deviations_json)
            
            # 2. General Risk Calculation
            tool = RiskCalculatorTool()
            violations_json = json.dumps(state["policy_violations"])
            risk_json = tool._run(clauses_json, violations_json)
            risk_dict = json.loads(risk_json)
            
            # 3. Merge Results
            risk_dict["legal_deviations"] = deviations_list
            risk_dict["deviation_count"] = len(deviations_list)
            
            state = {**state, "risk_data": risk_dict, "current_step": "risk_assessment"}
            compliance_status = self._log_and_check_compliance(state, "risk_assessment", AuditEventType.ANALYSIS_REQUEST)
            
            risk_score = risk_dict.get("overall_risk_score", 0)
            risk_level = risk_dict.get("risk_level", "UNKNOWN")
            workflow_tracker.complete_agent(execution, f"Risk Score: {risk_score}/100. Identified {len(deviations_list)} legal deviations.")
            
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Risk calculation failed: {e}")
            return {**state, "risk_data": {"overall_risk_score": 50.0, "risk_level": "MEDIUM"}}

    def _redline_node(self, state: IntelligenceState) -> IntelligenceState:
        """Generate redlines with stage-wise compliance."""
        violation_count = len(state["policy_violations"])
        execution = workflow_tracker.start_agent(
            "Redline Generation Agent",
            "Generate contract redline suggestions for policy violations",
            f"{violation_count} policy violations"
        )
        
        try:
            tool = RedlineGeneratorTool()
            violations_json = json.dumps(state["policy_violations"])
            redlines_json = tool._run(violations_json)
            redlines_list = json.loads(redlines_json)
            
            state = {**state, "redline_suggestions": redlines_list, "current_step": "redline_generation"}
            compliance_status = self._log_and_check_compliance(state, "redline_generation", AuditEventType.DOCUMENT_UPDATE)
            
            critical_redlines = len([r for r in redlines_list if r.get("priority") == "CRITICAL"])
            workflow_tracker.complete_agent(execution, f"Generated {len(redlines_list)} redlines ({critical_redlines} critical)")
            
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Redline generation failed: {e}")
            return {**state, "redline_suggestions": [], "is_complete": True}

    def _mcp_retrieval_node(self, state: IntelligenceState) -> IntelligenceState:
        """Retrieves external knowledge via MCP and specialized CUAD matcher."""
        execution = workflow_tracker.start_agent(
            "MCP Retrieval Agent",
            "Retrieve specialized legal context and match precedents",
            f"Analyzing {len(state['extracted_clauses'])} clauses"
        )
        
        try:
            # 1. Reuse existing specialized logic: Jurisdiction & Precedent matching
            jurisdiction_json = self.jurisdiction_tool._run(state["contract_text"])
            jurisdiction_info = json.loads(jurisdiction_json)
            
            clauses_json = json.dumps(state["extracted_clauses"])
            precedents_json = self.precedent_tool._run(clauses_json)
            precedents_list = json.loads(precedents_json)
            
            # 2. Integrate into MCP Context
            mcp_data = {
                "retrieved_at": datetime.now().isoformat(),
                "source": "legal_mcp_server",
                "jurisdiction": jurisdiction_info,
                "precedents": precedents_list,
                "precedent_count": len(precedents_list)
            }
            
            state = {**state, "mcp_context": mcp_data, "current_step": "mcp_retrieval"}
            compliance_status = self._log_and_check_compliance(state, "mcp_retrieval", AuditEventType.SEARCH_QUERY)
            
            workflow_tracker.complete_agent(execution, f"Retrieved {len(precedents_list)} precedents in {jurisdiction_info.get('jurisdiction', 'US-DE')}")
            return {**state, "compliance_status": compliance_status}
        except Exception as e:
            workflow_tracker.error_agent(execution, f"MCP retrieval failed: {e}")
            return {**state, "mcp_context": {}}

    def _governance_node(self, state: IntelligenceState) -> IntelligenceState:
        """Performs automated compliance checks (HIPAA, FHIR, SOX)."""
        execution = workflow_tracker.start_agent(
            "Governance Agent",
            "Perform automated regulatory compliance checks",
            "Full intelligence state"
        )
        
        # 1. HIPAA Compliance (PHI/PII detection)
        hipaa_result = compliance_service.check_hipaa_compliance(state["contract_text"])
        
        # 2. FHIR Mapping
        fhir_mapping = compliance_service.map_to_fhir(state["extracted_clauses"])
        
        # 3. SOX Audit Trail Generation
        # BUG-09 FIX: workflow_id not in IntelligenceState — derive from metadata timestamp (consistent with _log_and_check_compliance)
        metadata = state.get("metadata") or {}
        workflow_id = metadata.get("ingestion_timestamp", "unknown")
        sox_audit = compliance_service.generate_sox_audit_trail({
            "workflow_id": workflow_id,
            "estimated_value": state["risk_data"].get("financial_impact", "LOW")
        })

        
        compliance_status = {
            "hipaa": hipaa_result,
            "fhir": fhir_mapping,
            "sox": sox_audit,
            "overall_status": "PASS" if hipaa_result["status"] == "PASS" else "FLAGGED"
        }
        
        workflow_tracker.complete_agent(execution, f"Compliance check completed: {compliance_status['overall_status']}")
        return {**state, "compliance_status": compliance_status, "current_step": "governance"}

    def _human_review_node(self, state: IntelligenceState) -> IntelligenceState:
        """Determines if human review is required and prepares state."""
        # Check if human review is needed based on governance/risk
        is_risky = state["risk_data"].get("overall_risk_score", 0) > 70
        is_flagged = state["compliance_status"].get("overall_status") == "FLAGGED"
        is_critical = any(v.get("severity") == "CRITICAL" for v in state.get("policy_violations", []))
        
        needs_review = is_risky or is_flagged or is_critical
        
        if needs_review:
            logger.info("⚠️ HUMAN REVIEW REQUIRED due to high risk or compliance flags")
            # In a real LangGraph HITL workflow, we would use interrupt() here.
            return {**state, "human_review_required": True, "current_step": "human_review"}
        
        return {**state, "human_review_required": False, "current_step": "human_review"}

    def _output_node(self, state: IntelligenceState) -> IntelligenceState:
        """Finalizes the analysis and formats the output."""
        execution = workflow_tracker.start_agent(
            "Output Agent",
            "Finalize contract review report",
            "Full analysis state"
        )
        
        # Final formatting logic
        final_result = {
            "workflow_status": "COMPLETED",
            "compliance_summary": state["compliance_status"],
            "risk_summary": state["risk_data"],
            "human_review_required": state["human_review_required"],
            "generated_at": datetime.now().isoformat()
        }
        
        workflow_tracker.complete_agent(execution, "Report finalized and status set to COMPLETED")
        return {**state, 
            "is_complete": True, 
            "current_step": "output",
            "processing_result": {"status": "success", "message": "Full Agentic review completed"}
        }
    

    def analyze_contract(self, contract_text: str, use_planning: bool = True) -> dict:

        """Run analysis with optional autonomous planning"""
        try:
            if use_planning:
                try:
                    # Use asyncio.run with proper event loop handling
                    import asyncio
                    try:
                        # Try to get current loop
                        loop = asyncio.get_running_loop()
                        # If we're in an event loop, create a task
                        import concurrent.futures
                        with concurrent.futures.ThreadPoolExecutor() as executor:
                            future = executor.submit(asyncio.run, self._analyze_with_planning(contract_text))
                            return future.result()
                    except RuntimeError:
                        # No event loop running, safe to use asyncio.run
                        return asyncio.run(self._analyze_with_planning(contract_text))
                except Exception as planning_error:
                    logger.error(f"Planning agent failed: {planning_error}, falling back to traditional workflow")
                    return self._analyze_traditional(contract_text)
            else:
                return self._analyze_traditional(contract_text)
            
        except Exception as e:
            logger.error(f"Analysis failed: {e}")
            return {
                "clauses": [],
                "violations": [],
                "risk_assessment": {"overall_risk_score": 0, "risk_level": "UNKNOWN"},
                "redlines": [],
                "processing_complete": False
            }
    
    async def _analyze_with_planning(self, contract_text: str) -> dict:
        """Analyze contract using autonomous planning agent"""
        logger.info("🧠 STEP 1: Starting Planning Agent Analysis")
        
        try:
            # Step 1: Track planning agent
            planning_execution = workflow_tracker.start_agent(
                "Autonomous Planning Agent",
                "Analyze query and create optimal execution plan",
                "Contract analysis requirements"
            )
            
            # Step 2: Create execution plan
            logger.info("🧠 STEP 2: Creating execution plan")
            query = "Perform comprehensive contract analysis including clause extraction, policy compliance, risk assessment, and redline generation"
            execution_plan = self.planning_agent.create_execution_plan(query)
            logger.info(f"🧠 STEP 3: Plan created with {len(execution_plan.steps)} steps")
            
            # Complete planning agent tracking with detailed plan info
            step_details = " → ".join([f"{step.step_type.value.replace('_', ' ').title()}" for step in execution_plan.steps])
            workflow_tracker.complete_agent(
                planning_execution, 
                f"Created {execution_plan.strategy} plan: {step_details} (Est: {execution_plan.estimated_duration}s)"
            )
            
            # Step 2: Execute the planned workflow
            logger.info("🧠 STEP 4: Starting plan execution")
            results = await self.execution_engine.execute_plan(execution_plan, contract_text)
            logger.info(f"🧠 STEP 5: Plan execution completed: {results.get('processing_complete')}")
            
            # Step 3: Provide feedback
            logger.info("🧠 STEP 6: Providing feedback to planning agent")
            success_rate = 1.0 if results.get("processing_complete") else 0.0
            self.planning_agent.adapt_plan_from_feedback(execution_plan.plan_id, {"success_rate": success_rate})
            
            logger.info("🧠 STEP 7: Planning agent analysis completed successfully")
            return results
            
        except Exception as e:
            # Mark planning agent as failed if we have the execution reference
            try:
                workflow_tracker.error_agent(planning_execution, f"Planning failed: {str(e)}")
            except:
                pass  # planning_execution might not be defined if error occurred early
            
            logger.error(f"🧠 PLANNING AGENT ERROR at step: {e}")
            import traceback
            logger.error(f"🧠 Full traceback: {traceback.format_exc()}")
            raise e
    
    def _analyze_traditional(self, contract_text: str) -> dict:
        """Traditional workflow analysis (fallback)"""
        # Start workflow tracking
        workflow_tracker.start_workflow()
        
        # BUG-02 FIX: Initialize ALL fields defined in IntelligenceState to prevent KeyError at runtime
        initial_state = {
            # Input
            "contract_text": contract_text,
            "metadata": {},                    # Populated by _upload_node
            # Analysis results
            "extracted_clauses": [],
            "policy_violations": [],
            "risk_data": {},
            "redline_suggestions": [],
            # CUAD / specialized results
            "cuad_deviations": [],
            "jurisdiction_info": {},
            "precedent_matches": [],
            # Pattern analysis
            "pattern_used": "",
            "pattern_analysis": {},
            # Compliance
            "compliance_status": {},           # Populated stage-by-stage
            "mcp_context": {},                 # Populated by _mcp_retrieval_node
            # Workflow metadata
            "messages": [],
            "current_step": "",
            "processing_result": None,
            "human_review_required": False,    # Set by _human_review_node
            "is_complete": False
        }

        
        # Run workflow
        final_state = self.workflow.invoke(initial_state)
        
        # Complete workflow tracking
        workflow_tracker.complete_workflow()
        
        # Return structured results with CUAD data and validation
        return {
            "clauses": final_state["extracted_clauses"],
            "violations": final_state["policy_violations"],
            "risk_assessment": final_state["risk_data"],
            "redlines": final_state["redline_suggestions"],
            "cuad_deviations": final_state.get("cuad_deviations", []),
            "jurisdiction_info": final_state.get("jurisdiction_info", {}),
            "precedent_matches": final_state.get("precedent_matches", []),
            "validation_result": final_state.get("validation_result"),
            "pattern_used": final_state.get("pattern_used", "Standard"),
            "pattern_analysis": final_state.get("pattern_analysis", {}),
            "processing_complete": final_state["is_complete"]
        }

class ContractIntelligenceAgentFactory:
    """Factory following proper design patterns"""
    
    @staticmethod
    def create_orchestrator(llm):
        """Create orchestrator with proper architecture"""
        return IntelligenceOrchestrator(llm)