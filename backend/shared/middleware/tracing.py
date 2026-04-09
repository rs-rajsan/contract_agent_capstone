import uuid
from typing import Callable, Awaitable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
from backend.shared.utils.logger import (
    correlation_id_var, 
    user_id_var, 
    session_id_var, 
    org_id_var, 
    contract_id_var,
    span_id_var,
    operation_var,
    agent_name_var,
    hallucination_flag_var,
    get_logger
)

logger = get_logger(__name__)

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
            hallucination_flag_var.set(False)
        ]
        
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
