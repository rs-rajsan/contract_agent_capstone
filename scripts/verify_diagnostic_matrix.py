import asyncio
import sys
import os
import json
from unittest.mock import MagicMock, patch, AsyncMock

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ⚠️ Patch dependencies BEFORE any backend imports
sys.modules['langchain_neo4j'] = MagicMock()
sys.modules['backend.shared.utils.contract_search_tool'] = MagicMock()
sys.modules['backend.infrastructure.contract_repository'] = MagicMock()
# Mock the base entities if needed
sys.modules['backend.domain.entities'] = MagicMock()

from backend.application.services.system_health_manager import SystemHealthManager
from backend.shared.constants.status_codes import SystemStatusCodes

async def test_diagnostic_matrix():
    print("Starting Automated Diagnostic Matrix Verification...\n")
    
    # Mock LLM Manager
    mock_llm_manager = MagicMock()
    health_manager = SystemHealthManager(llm_manager=mock_llm_manager)
    
    # 1. Test UNAUTHORIZED (401)
    print("Testing 401 Unauthorized (LLM)...")
    mock_llm = AsyncMock()
    
    with patch.object(mock_llm, 'ainvoke', side_effect=Exception("401 Unauthorized: Invalid API Key")):
        mock_llm_manager.get_llm_instance.return_value = mock_llm
        result = await health_manager._test_single_agent("Test Agent", "model-key")
        assert result["status_code"] == 401
        assert "Invalid API credentials" in result["user_facing_message"]
        print("OK: 401 Mapped Correctly")

    # 2. Test RATE_LIMIT (429)
    print("Testing 429 Rate Limit (LLM)...")
    with patch.object(mock_llm, 'ainvoke', side_effect=Exception("429 Resource has been exhausted (e.g. check quota)")):
        result = await health_manager._test_single_agent("Test Agent", "model-key")
        assert result["status_code"] == 429
        assert "RateLimitError" in result["error_condition"]
        print("OK: 429 Mapped Correctly")

    # 3. Test INTERNAL_ERROR (500)
    print("Testing 500 Internal Error (Database)...")
    # Patch the health manager's internal import of the repository class
    import backend.infrastructure.contract_repository as mock_repo_mod
    mock_repo_class = mock_repo_mod.Neo4jContractRepository
    mock_repo_inst = mock_repo_class.return_value
    mock_repo_inst.check_connection.return_value = False
    
    # Re-wrap in MagicMock if needed, but since we already mocked the module, it should work
    result = await health_manager.check_database()
    assert result["status_code"] == 500
    assert "Database or internal system" in result["user_facing_message"]
    print("OK: 500 Mapped Correctly")

    # 4. Test SUCCESS (200)
    print("Testing 200 Success (All Components)...")
    with patch("backend.llm_manager.LLMManager") as MockLLMManager, \
         patch("backend.shared.utils.gemini_embedding_service.embedding.generate_embedding_async", new_callable=AsyncMock) as mock_embed:
        
        # Setup mocks
        mock_llm_manager_inst = MockLLMManager.return_value
        mock_llm = AsyncMock()
        mock_llm.ainvoke.return_value = "pong"
        mock_llm_manager_inst.get_llm_instance.return_value = mock_llm
        
        mock_embed.return_value = [0.1, 0.2]
        
        # Mock database success
        mock_repo_inst.check_connection.return_value = True
        
        hm = SystemHealthManager(llm_manager=mock_llm_manager_inst)
        results = await hm.run_full_diagnostic()
        
        all_ok = all(r["status_code"] == 200 for r in results)
        assert all_ok == True
        print(f"OK: Full Diagnostic Success Mapped Correctly ({len(results)} components)")

    print("\nAll status code matrix mappings verified!")

if __name__ == "__main__":
    asyncio.run(test_diagnostic_matrix())
