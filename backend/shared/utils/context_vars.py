import contextvars

# Context variables for request tracing and tracking authenticated actor (SRP, DRY)
# Raj's Core Trace vars
correlation_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("correlation_id", default="")
user_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("user_id", default="")
session_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("session_id", default="")
org_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("org_id", default="")
contract_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("contract_id", default="")
span_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("span_id", default="")
operation_var: contextvars.ContextVar[str] = contextvars.ContextVar("operation", default="")
agent_name_var: contextvars.ContextVar[str] = contextvars.ContextVar("agent_name", default="")
hallucination_flag_var: contextvars.ContextVar[bool] = contextvars.ContextVar("hallucination_flag", default=False)

# Sree's Auth vars
username_var: contextvars.ContextVar[str] = contextvars.ContextVar("username", default="")
