from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.base import BaseCheckpointSaver
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
from typing import Dict, Any, List, Optional

from backend.shared.utils.logger import get_logger
from backend.shared.compliance_service import compliance_service
from backend.infrastructure.text_extractors import TextExtractionService
from backend.infrastructure.mcp_client import mcp_client
from backend.infrastructure.audit_logger import AuditLogger, AuditEventType
logger = get_logger(__name__)

from backend.agents.agents_registry import AgentRegistry

class IntelligenceOrchestrator:
    """Proper multi-agent orchestrator following SOLID principles"""
    
    def __init__(self, llm, saver: Optional[BaseCheckpointSaver] = None):
        self.llm = llm
        self.saver = saver
        self.registry = AgentRegistry()
        self.workflow = self._build_workflow()
        self.planning_agent = PlanningAgentFactory.create_planning_agent()
        self.execution_engine = PlanExecutionEngine()
        self.audit_logger = AuditLogger()
    
    def _build_workflow(self) -> StateGraph:
        """Build standardized agentic workflow with compliance and HITL."""
        workflow = StateGraph(IntelligenceState)
        
        # Register nodes using the decoupled AgentRegistry
        workflow.add_node("upload", self.registry.get_agent("upload").execute)
        workflow.add_node("planning", self.registry.get_agent("planning").execute)
        workflow.add_node("parser", self.registry.get_agent("parser").execute)
        workflow.add_node("splitter", lambda state: AgentRegistry.get_agent("splitter").execute(state))
        workflow.add_node("policy_checking", lambda state: AgentRegistry.get_agent("policy_checking").execute(state))
        workflow.add_node("risk_assessment", lambda state: AgentRegistry.get_agent("risk_assessment").execute(state))
        workflow.add_node("mcp_retrieval", lambda state: AgentRegistry.get_agent("mcp_retrieval").execute(state))
        workflow.add_node("redline_generation", lambda state: AgentRegistry.get_agent("redline_generation").execute(state))
        workflow.add_node("governance", lambda state: AgentRegistry.get_agent("governance").execute(state))
        workflow.add_node("human_review", lambda state: AgentRegistry.get_agent("human_review").execute(state))
        workflow.add_node("output", lambda state: AgentRegistry.get_agent("output").execute(state))
        
        # Define edges — full 10-node sequence
        workflow.set_entry_point("upload")
        workflow.add_edge("upload", "planning")
        workflow.add_edge("planning", "parser")
        workflow.add_edge("parser", "splitter")
        workflow.add_edge("splitter", "policy_checking")
        workflow.add_edge("policy_checking", "risk_assessment")
        workflow.add_edge("risk_assessment", "mcp_retrieval")
        workflow.add_edge("mcp_retrieval", "redline_generation")
        workflow.add_edge("redline_generation", "governance")
        
        # Add conditional edge for refinement loop
        workflow.add_conditional_edges(
            "governance",
            self._governance_router,
            {
                "refine": "redline_generation",
                "proceed": "human_review"
            }
        )
        
        workflow.add_edge("human_review", "output")
        workflow.add_edge("output", END)
        
        return workflow.compile(checkpointer=self.saver)

    def _governance_router(self, state: IntelligenceState) -> str:
        """Determines if the contract needs more redlining or can proceed to review."""
        if state.get("refinement_needed"):
            logger.info("🔁 REFINEMENT LOOP: Critical violations detected, returning to Redline Generation.")
            return "refine"
        return "proceed"

    def analyze_contract(self, contract_text: str, query: str = "Analyze risk and compliance", use_planning: bool = True) -> dict:
        """Run analysis with optional autonomous planning"""
        
        # Initial State
        initial_state = {
            "contract_text": contract_text,
            "metadata": {
                "tenant_id": "demo_tenant_1",
                "ingestion_timestamp": datetime.now().isoformat(),
                "query": query,
                "use_planning": use_planning
            },
        }
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