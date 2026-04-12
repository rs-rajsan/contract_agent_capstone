import uuid
import contextvars
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
from backend.shared.utils.logger import get_logger
from backend.shared.utils.context_vars import (
    correlation_id_var, 
    user_id_var, 
    session_id_var, 
    org_id_var, 
    contract_id_var,
    span_id_var,
    operation_var,
    agent_name_var,
    hallucination_flag_var,
    username_var
)
from backend.auth.jwt_service import decode_token

logger = get_logger(__name__)

def _try_set_user_context(request: Request) -> tuple:
    """Extract user info from JWT if present, without raising errors"""
    auth_header = request.headers.get("Authorization")
    user_token_id = None
    user_token_name = None
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = decode_token(token)
            # Setting context vars for the current async flow
            username_var.set(payload.sub)
            user_token_name = payload.sub
            # If payload has user_id, set it too
            if hasattr(payload, 'id'):
                user_id_var.set(str(payload.id))
                user_token_id = str(payload.id)
        except Exception:
            pass # Unauthenticated/invalid tokens are ignored here, let auth dependencies handle it
            
    return user_token_id, user_token_name

class TracingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI Middleware to inject and track unique identifiers (Correlation, User, Session, etc.) per request.
    This enables full request observability and correlation across logs and LLM calls.
    It synchronizes with OpenTelemetry Trace ID for cross-stack visibility.
    """
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        # 1. Sync Correlation ID with OTEL Trace ID
        current_span = trace.get_current_span().get_span_context()
        otel_trace_id = format(current_span.trace_id, '032x') if current_span.is_valid else None
        correlation_id = request.headers.get("X-Correlation-ID", otel_trace_id or str(uuid.uuid4()))
        
        # 2. Extract Enterprise Context Headers
        user_id = request.headers.get("X-User-ID", "")
        session_id = request.headers.get("X-Session-ID", "")
        org_id = request.headers.get("X-Org-ID", "")
        contract_id = request.headers.get("X-Contract-ID", "")
        
        # 3. Set Context Variables for this async flow
        tokens = [
            correlation_id_var.set(correlation_id),
            user_id_var.set(user_id),
            session_id_var.set(session_id),
            org_id_var.set(org_id),
            contract_id_var.set(contract_id),
            span_id_var.set(""), # Initialized per request
            operation_var.set(""),
            agent_name_var.set(""),
            hallucination_flag_var.set(False),
            username_var.set("")
        ]
        
        # 4. Extract and set user context from JWT if available (overwrites user_id_var if present in token)
        _try_set_user_context(request)
        
        # Optional: Log the incoming request enriched with context
        logger.info(f"Handling incoming request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            # Link the correlation ID back to the client response
            response.headers["X-Correlation-ID"] = correlation_id
            return response
        finally:
            # Always reset the context variables to prevent bleed-over between requests
            correlation_id_var.reset(tokens[0])
            user_id_var.reset(tokens[1])
            session_id_var.reset(tokens[2])
            org_id_var.reset(tokens[3])
            contract_id_var.reset(tokens[4])
            span_id_var.reset(tokens[5])
            operation_var.reset(tokens[6])
            agent_name_var.reset(tokens[7])
            hallucination_flag_var.reset(tokens[8])
            username_var.reset(tokens[9])
