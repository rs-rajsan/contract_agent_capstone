from enum import IntEnum
from typing import Dict, Any

class SystemStatusCodes(IntEnum):
    """
    Centralized architectural status codes for the Contract Intelligence system.
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
    
    # Component Specific (6xx)
    DATABASE_LOCKED = 603
    PROTOCOL_ERROR = 601

def get_status_metadata(code: int) -> Dict[str, Any]:
    """
    Retrieve standardized metadata for a given status code.
    Used to bridge technical codes with user-facing diagnostic messages.
    """
    metadata = {
        SystemStatusCodes.OK: {
            "error_condition": "Success",
            "user_message": "System operational"
        },
        SystemStatusCodes.UNAUTHORIZED: {
            "error_condition": "AuthenticationError",
            "user_message": "Invalid API credentials detected."
        },
        SystemStatusCodes.FORBIDDEN: {
            "error_condition": "PermissionError",
            "user_message": "Access denied to specific models (Tier issue)."
        },
        SystemStatusCodes.NOT_FOUND: {
            "error_condition": "NotFoundError",
            "user_message": "Configured model is unavailable."
        },
        SystemStatusCodes.TIMEOUT: {
            "error_condition": "RequestTimeout",
            "user_message": "Diagnostic timed out. Please check connectivity."
        },
        SystemStatusCodes.CONFIG_ERROR: {
            "error_condition": "ConfigurationError",
            "user_message": "System configuration missing. Check .env file."
        },
        SystemStatusCodes.RATE_LIMIT: {
            "error_condition": "RateLimitError",
            "user_message": "Service rate-limited or Quota exhausted."
        },
        SystemStatusCodes.INTERNAL_ERROR: {
            "error_condition": "SystemError",
            "user_message": "Database or internal system is unresponsive."
        },
        SystemStatusCodes.MODEL_BUSY: {
            "error_condition": "OverloadedError",
            "user_message": "Model services currently overloaded."
        },
        SystemStatusCodes.NETWORK_ERROR: {
            "error_condition": "NetworkError",
            "user_message": "Network error reaching model providers."
        }
    }
    
    return metadata.get(code, {
        "error_condition": "UnknownError",
        "user_message": "An unexpected error occurred during health check."
    })
