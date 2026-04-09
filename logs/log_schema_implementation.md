# Analysis: Unified End-to-End Tracing Schema (FINAL RECOMMENDATION)

This plan outlines the "Trace-First" logging strategy to link frontend browser sessions to backend agentic workflows. By standardizing on this comprehensive JSONL schema, you gain the ability to drill down by user, session, contract, or organization instantly.

## The Complete "Trace-First" Object Structure

Every log entry across both Frontend and Backend should follow this structure:

```json
{
  "timestamp": "2026-04-09T01:51:33Z",
  "service_name": "contract-agent-backend",   // Identified: frontend | backend
  "environment": "development",               // Context: dev | staging | prod
  "correlation_id": "c4cbc9ef...",            // Trace: Unique ID for the entire request tree
  "user_id": "user_99",                       // Identity: The person initiating the action
  "session_id": "sess_8822x",                 // Temporal: The specific browser session
  "org_id": "org_enterprise_corp",            // Corporate: For multi-tenant isolation
  "contract_id": "cont_2024_001_nda",         // Domain: The specific asset being processed
  "span_id": "a1b2c3d4",                      // Step: Unique ID for this specific code block
  "operation": "risk_assessment",             // Action: The task being performed
  "component": "LLM",                         // Logical: LLM | Database | API | UI
  "status": "success",                        // Outcome: success | error | warning
  "latency_ms": 12868,                        // Performance: Critical for bottleneck analysis
  "payload": {                                // Data: Inputs/Outputs (optional)
    "model": "gemini-2.5-pro",
    "prompt_summary": "Scanning for indemnify clauses",
    "result_count": 5
  },
  "error": null                               // Debug: Detailed stack trace on failure
}
```

## Proposed Implementation Plan

### Phase 1: Context-Aware Backend Logger
- Update `backend/shared/utils/logger.py` to use a `ContextVar` that holds all these IDs.
- Any agent or service that logs will automatically inherit these fields from the request context.

### Phase 2: Frontend OTEL Enrichment
- Update the React `tracing.ts` to capture and forward `user_id` and `session_id` to the backend.
- Ensure the `service_name` is hardcoded as `contract-agent-frontend`.

### Phase 3: Unified Audit File
- Consolidate all logs into `logs/unified_agent_audit.jsonl`.
- This file becomes the single source of truth for all system activity.

## Open Questions

- Should we include **Raw LLM Input/Output** in the `payload` block? (Warning: This significantly increases log size but is powerful for agent debugging).
- Should the `org_id` be pulled from the API key metadata or a separate header?
