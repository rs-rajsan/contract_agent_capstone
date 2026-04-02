import logging
import uuid
from contextvars import ContextVar
from datetime import datetime
from typing import Dict, Any, Optional
from backend.infrastructure.audit_logger import AuditLogger, AuditEventType

# Context variable to store trace_id for the current task/request
trace_id_var: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)

class MCPLogger:
    """
    Centralized logging framework for MCP layer with request tracing.
    Follows SOLID principles by separating tracing logic from business logic.
    """
    
    def __init__(self, name: str = "mcp_server"):
        self.logger = logging.getLogger(name)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - [TraceID: %(trace_id)s] - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
            
        self.audit_logger = AuditLogger()

    def _get_trace_id(self) -> str:
        tid = trace_id_var.get()
        if tid is None:
            tid = str(uuid.uuid4())
            trace_id_var.set(tid)
        return tid

    def _truncate_metadata(self, metadata: Dict[str, Any], max_len: int = 500) -> Dict[str, Any]:
        """Truncate long strings in metadata to prevent log bloating"""
        truncated = {}
        for k, v in metadata.items():
            if isinstance(v, str) and len(v) > max_len:
                truncated[k] = v[:max_len] + "... [TRUNCATED]"
            elif isinstance(v, dict):
                truncated[k] = self._truncate_metadata(v, max_len)
            else:
                truncated[k] = v
        return truncated

    def info(self, message: str, metadata: Optional[Dict[str, Any]] = None):
        tid = self._get_trace_id()
        self.logger.info(message, extra={"trace_id": tid})
        if metadata:
            truncated_meta = self._truncate_metadata(metadata)
            self.logger.info(f"Metadata: {truncated_meta}", extra={"trace_id": tid})

    def error(self, message: str, error: Exception, metadata: Optional[Dict[str, Any]] = None):
        tid = self._get_trace_id()
        self.logger.error(f"{message}: {str(error)}", extra={"trace_id": tid}, exc_info=True)
        
        # Log to AuditLogger for persistence in Neo4j
        truncated_meta = self._truncate_metadata(metadata or {})
        self.audit_logger.log_event(
            event_type=AuditEventType.PROCESSING_ERROR,
            resource_id="mcp_server",
            action=message,
            status="error",
            error_details=str(error),
            metadata={**truncated_meta, "trace_id": tid}
        )

    def log_tool_execution(self, tool_name: str, tenant_id: str, status: str = "success", metadata: Optional[Dict[str, Any]] = None):
        tid = self._get_trace_id()
        truncated_meta = self._truncate_metadata(metadata or {})
        self.info(f"Executing tool {tool_name} for tenant {tenant_id}", metadata=truncated_meta)
        
        # Persistent audit trail in Neo4j
        self.audit_logger.log_event(
            event_type=AuditEventType.ANALYSIS_REQUEST,
            resource_id=tool_name,
            action="execute_mcp_tool",
            tenant_id=tenant_id,
            status=status,
            metadata={**truncated_meta, "trace_id": tid}
        )

def get_mcp_logger(name: str = "mcp_server") -> MCPLogger:
    return MCPLogger(name)
