import logging
import logging.handlers
import json
import contextvars
import os
from datetime import datetime
from typing import Optional

# ContextVar to store the correlation ID for the current async flow
correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")

class JsonFormatter(logging.Formatter):
    """
    A unified standard JSON formatter that automatically injects the active correlation_id
    and supports rich metadata enrichment (agent, operation, latency, tokens).
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
        }
        
        # Inject correlation ID
        correlation_id = correlation_id_var.get()
        if correlation_id:
            log_record["correlation_id"] = correlation_id
            
        # Metadata enrichment (Expert Recommendations)
        for field in ["agent_name", "operation", "latency_ms", "tokens"]:
            if hasattr(record, field):
                log_record[field] = getattr(record, field)
            
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

def setup_logging(level: int = logging.INFO):
    """
    Configure the root Python logger to use our JSON Formatter and both Stream and File handlers.
    """
    # Create logs directory if it doesn't exist
    # Use /app/logs if in container (WORKDIR /app), otherwise fallback to local logs dir
    if os.path.exists("/app"):
        log_dir = "/app/logs"
    else:
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
        
    if not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir, exist_ok=True)
        except Exception:
            pass # Fallback if we can't create the dir
            
    log_file = os.path.join(log_dir, "agent_steps.jsonl")
    
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
