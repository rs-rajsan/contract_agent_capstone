# Contract Intelligence Multi-Agent Architecture

This document outlines the multi-agent architecture implemented in the Contract Intelligence Platform. The system uses a hybrid approach, combining **state-machine driven orchestration** (LangGraph) for complex workflows with **SOLID-based supervisor patterns** for deterministic, resilient tasks.

## 1. High-Level Architecture Overview

The multi-agent system consists of three distinct layers of orchestration and execution:

1. **Intelligence Orchestrator (LangGraph)**: Manages the end-to-end lifecycle of contract analysis involving multiple phases (parsing, policy checking, risk assessment).
2. **Supervisor Agent (SOLID Pattern)**: Handles deterministic workflows with built-in resilience (Circuit Breakers, Retries, Quality Gates).
3. **Dynamic Pattern Selectors**: Chooses the appropriate reasoning strategy (ReACT or Chain-of-Thought) based on query and document complexity.

## 2. Intelligence Orchestrator Flow (LangGraph)

The primary document analysis workflow is built using `langgraph`. It ensures a deterministic sequence of agent invocations, passing a shared `IntelligenceState` through each node.

```mermaid
graph TD
    classDef main fill:#e0f7fa,stroke:#006064,stroke-width:2px;
    classDef tool fill:#fff3e0,stroke:#e65100,stroke-width:1px;
    classDef compliance fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px;
    classDef endNode fill:#ffebee,stroke:#b71c1c,stroke-width:2px;

    Start((Start)) --> upload[Upload Agent]
    
    upload --> parser[Parser Agent]
    parser --> splitter[Clause Splitter Agent]
    
    splitter --> policy[Policy Compliance Agent]
    policy --> risk[Risk Assessment Agent]
    
    risk --> mcp[MCP Retrieval Node]
    mcp --> redline[Redline Generation Agent]
    
    redline --> gov[Governance Node]
    gov --> human[Human Review Node]
    
    human --> outputNode[Output Generation]
    outputNode --> END((END))

    %% Data tools associated with nodes
    splitter -.-> CTool[ClauseDetector Tool]
    policy -.-> PTool[PolicyChecker Tool]
    risk -.-> RTool[RiskCalculator Tool]
    risk -.-> DTool[DeviationDetector Tool]

    %% Compliance tracking attached to stages
    upload -.-> Audit[Audit & HIPAA Check]
    parser -.-> Audit
    splitter -.-> Audit
    policy -.-> Audit
    risk -.-> Audit

    class Start,END endNode;
    class upload,parser,splitter,policy,risk,mcp,redline,gov,human,outputNode main;
    class CTool,PTool,RTool,DTool tool;
    class Audit compliance;
```

### Key Components:
- **State Management (`IntelligenceState`)**: Maintains the contract text, extracted clauses, policy violations, risk data, and step-by-step compliance status.
- **Audit & Compliance**: Every node invocation triggers `_log_and_check_compliance()` to generate structured audit logs (SOX) and check for PHI (HIPAA).
- **Tool Integration**: Nodes heavily rely on specialized tools (e.g., `OptimizedDeviationDetectorTool` based on CUAD standards) rather than raw LLM prompts.

## 3. Supervisor Coordination (SOLID Architectures)

For highly structured sequential tasks, the system uses a custom `SupervisorAgent` built on strict OOP principles. This layer is distinct from LangGraph and acts as an orchestration engine emphasizing reliability.

```mermaid
classDiagram
    class SupervisorAgent {
        +coordinate_workflow(request: WorkflowRequest)
        -_execute_step_with_protection()
    }
    
    class CircuitBreakerManager {
        +execute_with_breaker()
    }
    
    class RetryManager {
        +execute_with_retry()
    }
    
    class QualityManager {
        +validate_agent_output()
    }
    
    class AgentRegistry {
        +get_agent(agent_id)
        +register_agent()
    }

    class IAgent {
        <<interface>>
        +execute(context)
    }

    SupervisorAgent --> CircuitBreakerManager
    SupervisorAgent --> RetryManager
    SupervisorAgent --> QualityManager
    SupervisorAgent --> AgentRegistry
    AgentRegistry --> IAgent : Resolves Configuration
```

**Workflow Execution Example (`contract_analysis`):**
1. **PDF Processing Agent** -> Extract structural text.
2. **Clause Extraction Agent** -> Identify clauses.
3. **Risk Assessment Agent** -> Evaluate risks.

Each step is wrapped in the `CircuitBreakerManager` to prevent cascading failures if an LLM provider goes down, and validated by the `QualityManager` (which scores outputs based on structural integrity and completeness).

## 4. Adaptive Reasoning Strategies

For complex tasks requiring planning, the system employs dynamic cognitive patterns (located in `backend/agents/patterns`).

```mermaid
flowchart LR
    Input[Complex Query / Contract] --> Selector{PatternSelector}
    
    Selector -- Low Complexity --> Standard[Standard Workflow]
    Selector -- Medium Complexity --> CoT[Chain-of-Thought Agent]
    Selector -- High Complexity / Multi-Hop --> ReACT[ReACT Agent]
    
    CoT --> Execution
    ReACT --> Tools[(External Tools / RAG)]
    Tools --> ReACT
    ReACT --> Execution
    Standard --> Execution
```

- **Pattern Selector**: Analyzes the input and routes to the most cost-efficient and capable agent.
- **ReACT Agent**: Used when the agent need to iteratively plan, use tools (like retrieval from Neo4j), observe the result, and decide the next action.
- **Chain of Thought**: Used when the task requires explicit, step-by-step logical reasoning to reach a conclusion without needing repeated external queries.

## 5. Agent Workflow Tracking

All agent executions, regardless of the orchestrator used, report to the `agent_workflow_tracker` (`backend/agents/agent_workflow_tracker.py`), which maintains an in-memory execution graph. This powers the visual Executive Dashboard, allowing users to see:
- Agent state (running, complete, error).
- Task duration.
- Extracted metadata (e.g., "Found 5 violations").
