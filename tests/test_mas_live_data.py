import os
import sys
import json
import asyncio
from typing import Dict, Any

# Root path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from unittest.mock import MagicMock, patch

# 0. Mock Neo4j BEFORE any backend imports
mock_graph = MagicMock()
# Mock the class itself so any instantiation returns our mock
patcher = patch('langchain_neo4j.Neo4jGraph', return_value=mock_graph)
patcher.start()

import backend.infrastructure.contract_repository
import backend.infrastructure.audit_logger
import backend.shared.utils.contract_search_tool

# Ensure existing singletons use the mock
backend.shared.utils.contract_search_tool.graph = mock_graph
backend.infrastructure.contract_repository.graph = mock_graph

from backend.agents.contract_intelligence_agents import ContractIntelligenceAgentFactory
from backend.agents.agent_workflow_tracker import workflow_tracker

async def run_live_test(file_path: str):
    """
    Test the full Agentic MAS with a live document.
    """
    print(f"\n🚀 STARTING LIVE MAS TEST: {file_path}")
    print("=" * 60)
    
    # 1. Mock LLM or use real if available
    # For this test, we'll use a simple mock that returns structured JSON for each node
    class MockLLM:
        def invoke(self, prompt):
            # This is not used by the refined nodes directly anymore (they use tools),
            # but may be needed by the orchestrator initialization.
            return "Mock LLM Response"

    llm = MockLLM()
    orchestrator = ContractIntelligenceAgentFactory.create_orchestrator(llm)
    
    # 2. Initial State with metadata pointing to the PDF
    initial_state = {
        "contract_text": "THIS IS A FALLBACK TEXT. PARSER SHOULD OVERWRITE THIS.",
        "metadata": {
            "file_path": file_path,
            "tenant_id": "demo_tenant_1",
            "contract_type": "MSA",
            "query": "Perform a detailed risk and policy compliance analysis of this MSA with specific focus on liability and data protection.",
            "contact_email": "test-user@example.com",
            "contact_phone": "+1-555-010-9999"
        },
        "extracted_clauses": [],
        "policy_violations": [],
        "risk_data": {},
        "redline_suggestions": [],
        "compliance_status": {},
        "mcp_context": {},
        "messages": [],
        "current_step": "init",
        "processing_result": None,
        "human_review_required": False,
        "refinement_needed": False,
        "is_complete": False
    }

    # 3. Run Workflow
    print("🧠 Invoking LangGraph workflow...")
    try:
        # We use invoke because we are in a sync wrapper or using a checkpointer
        # thread_id is required for MemorySaver
        config = {"configurable": {"thread_id": "test_thread_001"}}
        
        # Start tracking
        workflow_tracker.start_workflow()
        
        final_state = orchestrator.workflow.invoke(initial_state, config=config)
        
        # Complete tracking
        workflow_tracker.complete_workflow()
        
        # 4. Results Summary
        print("\n✅ WORKFLOW COMPLETED")
        print(f"Final Step: {final_state.get('current_step')}")
        print(f"Text Parsed: {len(final_state.get('contract_text', ''))} chars")
        print(f"Clauses Extracted: {len(final_state.get('extracted_clauses', []))}")
        print(f"Risk Score: {final_state.get('risk_data', {}).get('overall_risk_score', 'N/A')}")
        print(f"Compliance Status: {final_state.get('compliance_status', {}).get('overall_status', 'N/A')}")
        
        # 5. Check Audit Logs for Masking
        audit_file = os.path.join("logs", "audit.jsonl")
        if os.path.exists(audit_file):
            print(f"\n🛡️ Verifying Audit Logs: {audit_file}")
            with open(audit_file, "r") as f:
                last_logs = f.readlines()[-5:]
                for log in last_logs:
                    log_data = json.loads(log)
                    print(f"  [{log_data['timestamp']}] {log_data['action']} - Status: {log_data['status']}")
        
        return final_state
        
    except Exception as e:
        print(f"❌ Workflow failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    # Test file selection
    contract_file = os.path.join("data", "Clean_MSA.pdf")
    if not os.path.exists(contract_file):
        print(f"❌ File not found: {contract_file}")
        sys.exit(1)
        
    # Ensure logs dir exists
    os.makedirs("logs", exist_ok=True)
    
    asyncio.run(run_live_test(contract_file))
