import logging
import logging.handlers
import json
import contextvars
import os
from datetime import datetime
from typing import Optional

# ContextVars to store identifiers for the current async flow
correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")
user_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("user_id", default="")
session_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("session_id", default="")
org_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("org_id", default="")
contract_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("contract_id", default="")
span_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("span_id", default="")
operation_var: contextvars.ContextVar[str] = contextvars.ContextVar("operation", default="")
agent_name_var: contextvars.ContextVar[str] = contextvars.ContextVar("agent_name", default="")
hallucination_flag_var: contextvars.ContextVar[bool] = contextvars.ContextVar("hallucination_flag", default=False)

class JsonFormatter(logging.Formatter):
    """
    A unified standard JSON formatter that automatically injects active context identifiers
    (correlation_id, user_id, session_id, etc.) and supports rich metadata.
    """
    def format(self, record: logging.LogRecord) -> str:
        # 1. Base Core Fields
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "service_name": "contract-agent-backend",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "status": self._get_trace_status(record.levelname),
            "message": record.getMessage(),
        }
        
        # 2. Inject Contextual Identifiers (Trace-First)
        context_mapping = {
            "correlation_id": correlation_id_var,
            "user_id": user_id_var,
            "session_id": session_id_var,
            "org_id": org_id_var,
            "contract_id": contract_id_var,
            "span_id": span_id_var,
            "operation": operation_var,
            "agent_name": agent_name_var,
            "hallucination_detected": hallucination_flag_var
        }
        
        for key, var in context_mapping.items():
            val = var.get()
            if val or isinstance(val, bool): # Include bool even if False
                log_record[key] = val
            
        # 3. KPI & High-Priority Fields (Override from record if present)
        kpi_fields = ["agent_name", "operation", "latency_ms", "component", "hallucination_detected"]
        for field in kpi_fields:
            if hasattr(record, field):
                log_record[field] = getattr(record, field)

        # 4. Payload Enrichment (Grouping non-standard fields)
        payload = {}
        standard_fields = {
            "name", "msg", "args", "levelname", "levelno", "pathname", "filename", 
            "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName", 
            "created", "msecs", "relativeCreated", "thread", "threadName", 
            "processName", "process", "message"
        }
        trace_fields = {
            "timestamp", "service_name", "environment", "status", "message",
            "correlation_id", "user_id", "session_id", "org_id", "contract_id",
            "span_id", "operation", "agent_name", "hallucination_detected",
            "latency_ms", "component", "error"
        }
        
        # Capture anything else as payload
        for key, val in record.__dict__.items():
            if key not in standard_fields and key not in trace_fields:
                payload[key] = val
        
        if payload:
            log_record["payload"] = payload
            
        # 5. Error & Exception Handling
        if record.exc_info:
            log_record["error"] = self.formatException(record.exc_info)
        elif hasattr(record, "error") and getattr(record, "error"):
            log_record["error"] = getattr(record, "error")
        else:
            log_record["error"] = None
            
        return json.dumps(log_record)

    def _get_trace_status(self, levelname: str) -> str:
        """Map Python log levels to Trace-First status."""
        mapping = {
            "ERROR": "error",
            "CRITICAL": "error",
            "WARNING": "warning",
            "INFO": "success",
            "DEBUG": "success"
        }
        return mapping.get(levelname, "success")

def setup_logging(level: int = logging.INFO):
    """
    Configure the root Python logger to use our Unified JSON Formatter.
    """
    # Create logs directory if it doesn't exist
    if os.path.exists("/app"):
        log_dir = "/app/logs"
    else:
        # Resolve project root (4 levels up from backend/shared/utils/logger.py)
        current_file = os.path.abspath(__file__)
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
        log_dir = os.path.join(root_dir, "logs")
        
    if not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir, exist_ok=True)
        except Exception:
            pass 
            
    log_file = os.path.join(log_dir, "unified_agent_audit.jsonl")
    
    # Formatter
    formatter = JsonFormatter()
    
    # Stream Handler
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    
    # File Handler (Expert Recommendation: Persistent & Rolling)
    handlers = [stream_handler]
    
    try:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5
        )
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)
    except Exception as e:
        # Fallback if file handler fails
        logging.warning(f"Failed to initialize file logger: {e}")
    
    # Configure the root logger
    logging.root.setLevel(level)
    logging.root.handlers = handlers

def get_logger(name: str) -> logging.Logger:
    """
    Get a pre-configured logger instance (DRY).
    """
    return logging.getLogger(name)

# Ensure logging is setup globally as soon as this utility is imported
setup_logging()
