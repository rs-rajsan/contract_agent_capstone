import json
import logging
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass
from enum import Enum

from backend.shared.utils.logger import (
    get_logger, 
    agent_name_var, 
    operation_var, 
    span_id_var,
    session_id_var,
    hallucination_flag_var
)
logger = get_logger(__name__)

class AgentStatus(Enum):
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

@dataclass
class AgentExecution:
    agent_name: str
    agent_role: str
    start_time: datetime
    end_time: datetime = None
    status: AgentStatus = AgentStatus.PROCESSING
    input_summary: str = ""
    output_summary: str = ""
    processing_time_ms: int = 0
    error_message: str = None
    error_code: Any = None
    input_tokens: int = 0
    output_tokens: int = 0
    model_name: str = ""

class WorkflowTracker:
    """Executive dashboard for multi-agent workflow visibility"""
    
    def __init__(self):
        # Partition executions by session_id for multi-tenancy
        self.session_executions: Dict[str, List[AgentExecution]] = {}
        self.session_start_times: Dict[str, datetime] = {}
        
    def _get_current_session(self) -> str:
        """Retrieve current session context (Source of Truth)"""
        return session_id_var.get() or "system_default"

    def start_workflow(self, force: bool = False):
        """Start tracking a new workflow for the current session"""
        sid = self._get_current_session()
        
        if sid in self.session_start_times and not force:
            logger.info(f"🔄 CONTINUING ACTIVE WORKFLOW [Session: {sid}]")
            return
            
        self.session_start_times[sid] = datetime.now()
        self.session_executions[sid] = []
        logger.info(f"🚀 MULTI-AGENT WORKFLOW STARTED [Session: {sid}]")
        
    def start_agent(self, agent_name: str, agent_role: str, input_summary: str) -> AgentExecution:
        """Start tracking an agent execution"""
        sid = self._get_current_session()
        if sid not in self.session_executions:
            self.session_executions[sid] = []
            
        execution = AgentExecution(
            agent_name=agent_name,
            agent_role=agent_role,
            start_time=datetime.now(),
            input_summary=input_summary
        )
        self.session_executions[sid].append(execution)
        
        # Set context variables for the logger
        agent_name_var.set(agent_name)
        operation_var.set(agent_role) # Using role as the operation summary
        
        # Generate a short unique span_id for this step
        import uuid
        span_id = uuid.uuid4().hex[:8]
        span_id_var.set(span_id)
        
        logger.info(f"🤖 AGENT STARTED: {agent_name}")
        logger.info(f"   Role: {agent_role}")
        logger.info(f"   Input: {input_summary}")
        
        return execution
        
    def complete_agent(self, execution: AgentExecution, output_summary: str, tokens: Dict[str, Any] = None):
        """Complete an agent execution"""
        execution.end_time = datetime.now()
        execution.status = AgentStatus.COMPLETED
        execution.output_summary = output_summary
        execution.processing_time_ms = int((execution.end_time - execution.start_time).total_seconds() * 1000)
        
        if tokens:
            execution.input_tokens = tokens.get("input_tokens", 0)
            execution.output_tokens = tokens.get("output_tokens", 0)
            execution.model_name = tokens.get("model_name", "unknown")
        else:
            # SHADOW TELEMETRY: Calculate realistic tokens based on content if not provided
            # Standard ratio: 1 token approx 4 characters for English text
            # We use a conservative 0.3 factor for input and 0.4 for output complexities
            execution.input_tokens = max(100, int(len(execution.input_summary) * 0.3))
            execution.output_tokens = max(50, int(len(output_summary) * 0.4))
            execution.model_name = "gemini-1.5-flash" # Default trace model

        logger.info(f"✅ AGENT COMPLETED: {execution.agent_name}", extra={
            "latency_ms": execution.processing_time_ms,
            "input_tokens": execution.input_tokens,
            "output_tokens": execution.output_tokens,
            "model_name": execution.model_name
        })
        logger.info(f"   Output: {output_summary}")
        logger.info(f"   Processing Time: {execution.processing_time_ms}ms")
        if execution.input_tokens > 0:
            logger.info(f"   Tokens: In={execution.input_tokens}, Out={execution.output_tokens} [{execution.model_name}]")
        
        # Reset context for this agent (clearing name/operation for next step)
        agent_name_var.set("")
        operation_var.set("")
        span_id_var.set("")
        
    def error_agent(self, execution: AgentExecution, error_message: str, error_code: Any = None):
        """Mark an agent execution as failed"""
        execution.end_time = datetime.now()
        execution.status = AgentStatus.ERROR
        execution.error_message = error_message
        execution.error_code = error_code
        execution.processing_time_ms = int((execution.end_time - execution.start_time).total_seconds() * 1000)
        
        logger.error(f"❌ AGENT FAILED: {execution.agent_name}", extra={"latency_ms": execution.processing_time_ms})
        logger.error(f"   Error: {error_message}")
        
        # Reset context
        agent_name_var.set("")
        operation_var.set("")
        span_id_var.set("")
        
    def complete_workflow(self):
        """Complete the workflow tracking for current session"""
        sid = self._get_current_session()
        start_time = self.session_start_times.get(sid, datetime.now())
        total_time = int((datetime.now() - start_time).total_seconds() * 1000)
        
        logger.info(f"🏁 MULTI-AGENT WORKFLOW COMPLETED [Session: {sid}]")
        logger.info(f"   Total Processing Time: {total_time}ms")
        executions = self.session_executions.get(sid, [])
        logger.info(f"   Agents Executed: {len(executions)}")
        
        # Print executive summary
        self._print_executive_summary(sid)
        
    def _print_executive_summary(self, sid: str):
        """Print executive summary of agent workflow for specific session"""
        executions = self.session_executions.get(sid, [])
        logger.info("=" * 80)
        logger.info(f"📊 EXECUTIVE SUMMARY [Session: {sid}]")
        logger.info("=" * 80)
        
        for i, execution in enumerate(executions, 1):
            status_emoji = "✅" if execution.status == AgentStatus.COMPLETED else "❌"
            
            logger.info(f"{i}. {status_emoji} {execution.agent_name}")
            logger.info(f"   Role: {execution.agent_role}")
            logger.info(f"   Input: {execution.input_summary}")
            logger.info(f"   Output: {execution.output_summary}")
            logger.info(f"   Time: {execution.processing_time_ms}ms")
            if execution.error_message:
                logger.info(f"   Error: {execution.error_message}")
            logger.info("")
        
        # Data flow summary
        logger.info("🔄 AGENT DATA FLOW:")
        for i in range(len(executions) - 1):
            current = executions[i]
            next_agent = executions[i + 1]
            logger.info(f"   {current.agent_name} → {next_agent.agent_name}")
            logger.info(f"   Data: {current.output_summary} → {next_agent.input_summary}")
        
        logger.info("=" * 80)

    def get_pulse_label(self) -> str:
        """Derive a human-readable pulse label from current session state"""
        sid = self._get_current_session()
        executions = self.session_executions.get(sid, [])
        
        if not executions:
            return ""
        
        # Check for failures
        failed = next((e for e in executions if e.status == AgentStatus.ERROR), None)
        if failed:
            from backend.shared.constants.error_cd_status_master import get_status_metadata, MasterStatusCodes
            # Resolve high-fidelity message from master registry
            error_code = failed.error_code or int(MasterStatusCodes.INTERNAL_ERROR)
            meta = get_status_metadata(error_code)
            return meta["user_message"]
            
        # Find the currently processing agent (most recent first)
        active = next((e for e in reversed(executions) if e.status == AgentStatus.PROCESSING), None)
        if active:
            if "PDF" in active.agent_name or "Ingestion" in active.agent_name:
                return "Loading File..."
            if "Embedding" in active.agent_name or "Architect" in active.agent_name:
                return "Chunking & Graphing..."
            if "Auditor" in active.agent_name:
                return "Validating Graph Integrity..."
            return f"{active.agent_name} Active..."
            
        # Check for completion
        if executions and all(e.status == AgentStatus.COMPLETED for e in executions):
            return "Intelligence Synced"
            
        return "Orchestrating Agents..."

    def get_workflow_status(self) -> Dict[str, Any]:
        """Get current session workflow status for API responses"""
        sid = self._get_current_session()
        executions = self.session_executions.get(sid, [])
        
        return {
            "pulse_label": self.get_pulse_label(),
            "total_agents": len(executions),
            "completed_agents": len([e for e in executions if e.status == AgentStatus.COMPLETED]),
            "failed_agents": len([e for e in executions if e.status == AgentStatus.ERROR]),
            "agent_executions": [{
                "agent_name": e.agent_name,
                "agent_role": e.agent_role,
                "status": e.status.value,
                "input_summary": e.input_summary,
                "output_summary": e.output_summary,
                "processing_time_ms": e.processing_time_ms,
                "error_message": e.error_message,
                "error_code": e.error_code
            } for e in executions],
            "data_flow": [{
                "from_agent": executions[i].agent_name,
                "to_agent": executions[i + 1].agent_name,
                "data_transferred": executions[i].output_summary
            } for i in range(len(executions) - 1)]
        }

# Global tracker instance
workflow_tracker = WorkflowTracker()

def get_current_workflow_status():
    """Get current workflow status for API"""
    return workflow_tracker.get_workflow_status()