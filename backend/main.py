import json
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_core.messages import HumanMessage, ToolMessage, AIMessage, AIMessageChunk
from backend.llm_manager import LLMManager
from backend.api.document_upload import router as document_router
from backend.api.contract_intelligence import router as intelligence_router
from backend.api.routes.debug import create_debug_router
from backend.api.routes.production import create_production_router
from backend.shared.utils.route_utils import is_development, conditionally_include_router
from backend.api.enhanced_contract_search import router as enhanced_search_router
from backend.api.enhanced_document_upload import router as enhanced_upload_router
from backend.agents.agent_workflow_tracker import get_current_workflow_status
from backend.shared.middleware.tracing import TracingMiddleware
from backend.shared.utils.logger import get_logger, correlation_id_var

logger = get_logger(__name__)

import os
from openinference.instrumentation.langchain import LangChainInstrumentor

load_dotenv()

# Initialize Phoenix tracing (OpenTelemetry)
phoenix_endpoint = os.environ.get("PHOENIX_COLLECTOR_ENDPOINT", "http://localhost:6006/v1/traces")
try:
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    
    tracer_provider = TracerProvider()
    tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=phoenix_endpoint)))
    
    # Instrument LangChain
    LangChainInstrumentor().instrument(tracer_provider=tracer_provider)
    
    # Initialize app temporarily to instrument it
except Exception as e:
    logger.warning(f"Failed to initialize OpenTelemetry tracing: {e}")

from backend.agents.supervisor.supervisor_agent import SupervisorFactory

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - Initialize once
    try:
        app.state.llm_manager = LLMManager()
        # Create a persistent supervisor to track long-running workflows/agent status
        app.state.supervisor = SupervisorFactory.create_supervisor(app.state.llm_manager)
        logger.info("✅ LLMManager and Supervisor initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize application state: {e}")
        app.state.llm_manager = None
        app.state.supervisor = None
    
    logger.info("FastAPI Backend Listening on http://0.0.0.0:8000")
    yield
    # Shutdown - cleanup if needed

app = FastAPI(lifespan=lifespan)

# Instrument FastAPI after app creation
try:
    if 'tracer_provider' in locals():
        FastAPIInstrumentor.instrument_app(app, tracer_provider=tracer_provider)
        logger.info("✅ FastAPI successfully instrumented with OpenTelemetry")
except Exception as e:
    logger.warning(f"Failed to instrument FastAPI: {e}")

# Dependency injection
def get_llm_manager(request: Request):
    return request.app.state.llm_manager


app.add_middleware(TracingMiddleware)

# Configure CORS
try:
    cors_origins_str = os.getenv("CORS_ALLOWED_ORIGINS", '["*"]')
    allow_origins = json.loads(cors_origins_str)
except Exception as e:
    logger.warning(f"Failed to parse CORS_ALLOWED_ORIGINS, defaulting to ['*']: {e}")
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allow_origins,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers based on environment
app.include_router(document_router)
app.include_router(intelligence_router)
app.include_router(enhanced_search_router, prefix="/api")
app.include_router(enhanced_upload_router)

# Supervisor API
from backend.api.supervisor_api import router as supervisor_router
app.include_router(supervisor_router)

# Feedback API (Phase 2)
from backend.api.feedback_api import router as feedback_router
app.include_router(feedback_router)

# Monitoring API (Phase 3)
from backend.api.monitoring_api import router as monitoring_router
app.include_router(monitoring_router)

# Audit API (Production)
from backend.api.audit_api import router as audit_router
app.include_router(audit_router)

# AI Patterns API
from backend.api.patterns_api import router as patterns_router
app.include_router(patterns_router)

# Policy Management API
from backend.api.policy_api import router as policy_router
app.include_router(policy_router)

# Debug routes (development only)
debug_router = create_debug_router()
conditionally_include_router(app, debug_router, is_development())

@app.get("/api/workflow/status")
async def get_workflow_status():
    """Get current multi-agent workflow status for executive dashboard"""
    return get_current_workflow_status()

@app.get("/api/planning/status")
async def get_planning_status():
    """Get autonomous planning agent status"""
    from backend.agents.planning.planning_agent import PlanningAgentFactory
    
    planning_agent = PlanningAgentFactory.create_planning_agent()
    return {
        "agent_type": "Autonomous Planning & Reasoning Agent",
        "capabilities": [
            "Query Analysis & Decomposition",
            "Execution Plan Generation", 
            "Self-Reflection & Validation",
            "Adaptive Strategy Selection",
            "Performance Learning"
        ],
        "available_strategies": ["simple", "complex", "risk_focused", "compliance_focused"],
        "execution_history_count": len(planning_agent.execution_history)
    }


@app.get("/")
async def root():
    return {"status": "OK"}


class RunPayload(BaseModel):
    model: str
    prompt: str
    history: str

def rebuild_history(history):
    history = json.loads(history)

    type_to_class = {
        "human": HumanMessage,
        "tool": ToolMessage,
        "ai": AIMessage
    }

    messages = []
    for item_json_str in history:
        item = json.loads(item_json_str)
        item_class = type_to_class.get(item["type"])
        if item_class:
            # use pydantic BaseClass method to rebuild message model from json string dumped by model_dump_json
            messages.append(item_class.model_validate_json(item_json_str))

    return messages


async def runner(model: str, prompt: str, history: str, llm_mgr: LLMManager):
    logger.info(f"Processing LLM request for model '{model}'")
    
    # history comes in from FE as stringified list of dumped model messages
    if history != "[]":
        previous_messages = rebuild_history(history)
    else:
        previous_messages = []

    prompt_message = HumanMessage(content=prompt)
    input_messages = [*previous_messages, prompt_message]
    
    corr_id = correlation_id_var.get()
    run_tags = [f"correlation_id:{corr_id}"] if corr_id else []
    
    messages = llm_mgr.get_model_by_name(model).astream(
        input={"messages": input_messages}, 
        config={"tags": run_tags},
        stream_mode=["messages", "updates"]
    )

    # for demo purposes only:
    # - we are passing inmemory context as history around because we don't want to handle a db in this demo
    # - "updates" stream_mode returns AIMessage instead of AIMessageChunk which is less data to pass around than chunk models
    # - context is passed to FE and back on each /run/ endpoint call so AI is aware of the previous messages
    # - we are not storing context on server in order we don't kill all of it's memory - in production you would store it in a db
    context = json.loads(history)
    context.append(prompt_message.model_dump_json())

    async for message in messages:
        if message[0] == "messages":
            chunk = message[1]

            # output tool call section type
            if hasattr(chunk[0], "tool_calls") and len(chunk[0].tool_calls) > 0:
                for tool in chunk[0].tool_calls:
                    if tool.get('name'):
                        tool_calls_content = json.dumps(tool)
                        yield f"data: {json.dumps({'content': tool_calls_content, 'type': 'tool_call'})}\n\n"

            if isinstance(chunk[0], ToolMessage):
                yield f"data: {json.dumps({'content': chunk[0].content, 'type': 'tool_message'})}\n\n"
            if isinstance(chunk[0], AIMessageChunk):
                yield f"data: {json.dumps({'content': chunk[0].content, 'type': 'ai_message'})}\n\n"
            if isinstance(chunk[0], HumanMessage):
                yield f"data: {json.dumps({'content': chunk[0].content, 'type': 'user_message'})}\n\n"

        if message[0] == "updates":
            # use pydantic BaseClass method model_dump_json to dump message model to be stringified into history
            if "assistant" in message[1]:
                for history_message in message[1]["assistant"]["messages"]:
                    context.append(history_message.model_dump_json())
            elif "tools" in message[1]:
                for tool_message in message[1]["tools"]["messages"]:
                    if hasattr(tool_message, 'model_dump_json'):
                        context.append(tool_message.model_dump_json())
                    else:
                        context.append(json.dumps(tool_message))

    yield f"data: {json.dumps({'content': context, 'type': 'history'})}\n\n"
    yield f"data: {json.dumps({'content': '', 'type': 'end'})}\n\n"


@app.post("/api/run/")
async def run(payload: RunPayload, llm_mgr: LLMManager = Depends(get_llm_manager)):
    return StreamingResponse(
        runner(model=payload.model, prompt=payload.prompt, history=payload.history, llm_mgr=llm_mgr),
        media_type="text/event-stream",
    )