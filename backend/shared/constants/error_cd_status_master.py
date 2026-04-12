from enum import IntEnum
from typing import Dict, Any

class MasterStatusCodes(IntEnum):
    """
    MASTER REGISTRY: Definitive architectural status codes for the system.
    Standardizes error reporting across diagnostics and agent logs.
    """
    OK = 200
    
    # Client/Configuration Errors (4xx)
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    TIMEOUT = 408
    CONFIG_ERROR = 412
    RATE_LIMIT = 429
    
    # Server/Infrastructure Errors (5xx)
    INTERNAL_ERROR = 500
    BAD_GATEWAY = 502
    MODEL_BUSY = 503
    NETWORK_ERROR = 504
    DEPENDENCY_MISSING = 505
    
    # Component Specific (6xx)
    DATABASE_LOCKED = 603
    PROTOCOL_ERROR = 601
    
    # Frontend / UI Specific (7xx)
    UI_LOAD_ERROR = 701
    NAV_ERROR = 702
    AUTH_CLIENT_ERROR = 703
    
    # Agentic / Workflow Specific (8xx)
    PLAN_FAILURE = 801
    VAL_FAILURE = 802
    AGENT_TIMEOUT = 803

def get_status_metadata(code: int) -> Dict[str, Any]:
    """
    Retrieve standardized metadata for a given status code.
    Used to bridge technical codes with user-facing diagnostic messages.
    """
    metadata = {
        MasterStatusCodes.OK: {
            "error_condition": "Success",
            "user_message": "System operational"
        },
        MasterStatusCodes.UNAUTHORIZED: {
            "error_condition": "AuthenticationError",
            "user_message": "Invalid API credentials detected."
        },
        MasterStatusCodes.FORBIDDEN: {
            "error_condition": "PermissionError",
            "user_message": "Access denied to specific models (Tier issue)."
        },
        MasterStatusCodes.NOT_FOUND: {
            "error_condition": "NotFoundError",
            "user_message": "Configured model is unavailable."
        },
        MasterStatusCodes.TIMEOUT: {
            "error_condition": "RequestTimeout",
            "user_message": "Diagnostic timed out. Please check connectivity."
        },
        MasterStatusCodes.CONFIG_ERROR: {
            "error_condition": "ConfigurationError",
            "user_message": "System configuration missing. Check .env file."
        },
        MasterStatusCodes.RATE_LIMIT: {
            "error_condition": "RateLimitError",
            "user_message": "Service rate-limited or Quota exhausted."
        },
        MasterStatusCodes.INTERNAL_ERROR: {
            "error_condition": "SystemError",
            "user_message": "Database or internal system is unresponsive."
        },
        MasterStatusCodes.MODEL_BUSY: {
            "error_condition": "OverloadedError",
            "user_message": "Model services currently overloaded."
        },
        MasterStatusCodes.NETWORK_ERROR: {
            "error_condition": "NetworkError",
            "user_message": "Network error reaching model providers."
        },
        MasterStatusCodes.UI_LOAD_ERROR: {
            "error_condition": "UILoadError",
            "user_message": "High-fidelity UI failed to initialize core components."
        },
        MasterStatusCodes.NAV_ERROR: {
            "error_condition": "NavigationError",
            "user_message": "Client-side routing integrity check failed."
        },
        MasterStatusCodes.AUTH_CLIENT_ERROR: {
            "error_condition": "AuthClientError",
            "user_message": "Secure token store or session synchronization failed."
        },
        MasterStatusCodes.PLAN_FAILURE: {
            "error_condition": "PlanningFailure",
            "user_message": "Agentic supervisor failed to generate a valid execution plan."
        },
        MasterStatusCodes.VAL_FAILURE: {
            "error_condition": "ValidationFailure",
            "user_message": "Autonomous quality gate rejected the analysis output."
        },
        MasterStatusCodes.AGENT_TIMEOUT: {
            "error_condition": "AgentTimeout",
            "user_message": "Multi-agent orchestration exceeded the heartbeat threshold."
        },
        MasterStatusCodes.DEPENDENCY_MISSING: {
            "error_condition": "DependencyError",
            "user_message": "Required backend library missing. Environment rebuild needed."
        }
    }
    
    return metadata.get(code, {
        "error_condition": "UnknownError",
        "user_message": "An unexpected error occurred during diagnostic resolution."
    })

def get_full_registry() -> Dict[int, Dict[str, Any]]:
    """
    MASTER EXPORTER: Returns the entire status mapping for dynamic frontend resolution.
    This is the basis of the Zero-Redundancy Master/Child architecture.
    """
    # Create the metadata map dynamically for all MasterStatusCodes members
    registry = {}
    for status in MasterStatusCodes:
        registry[status.value] = get_status_metadata(status.value)
    return registry
