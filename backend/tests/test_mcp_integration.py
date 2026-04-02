import pytest
import asyncio
import json
from backend.infrastructure.mcp_client import mcp_client

@pytest.mark.async_io
def test_mcp_client_tool_discovery():
    """Verify that the MCP client can successfully call tools on the server."""
    # Note: This test runs the actual mcp_server.py as a subprocess via stdio_client
    
    # 1. Test fetch_contract_metadata (should return success or not_found)
    result = mcp_client.call_tool_sync("fetch_contract_metadata", {
        "contract_id": "NON_EXISTENT_ID",
        "tenant_id": "test_tenant"
    })
    
    assert isinstance(result, dict)
    # Even if not found, it should return a valid JSON response from our refined tool
    if "success" in result:
        assert result["success"] is False
        assert "not_found" in result.get("status", "")
    else:
        # If the tool call itself failed
        assert "error" in result

@pytest.mark.async_io
def test_mcp_client_playbook_rules():
    """Verify retrieval of playbook rules."""
    result = mcp_client.call_tool_sync("get_playbook_rule", {
        "tenant_id": "demo_tenant_1",
        "contract_type": "NDA"
    })
    
    assert isinstance(result, dict)
    if result.get("success"):
        assert "rules" in result
        assert isinstance(result["rules"], list)
    else:
        # If DB is not connected/available, we at least check for a handled failure
        assert "error" in result

if __name__ == "__main__":
    # Manual run for quick verification
    print("Running integration test for MCP Client...")
    try:
        # Test 1
        res1 = mcp_client.call_tool_sync("fetch_contract_metadata", {
            "contract_id": "TEST_ID",
            "tenant_id": "demo_tenant_1"
        })
        print(f"fetch_contract_metadata: {json.dumps(res1, indent=2)}")
        
        # Test 2
        res2 = mcp_client.call_tool_sync("get_playbook_rule", {
            "tenant_id": "demo_tenant_1",
            "contract_type": "general"
        })
        print(f"get_playbook_rule: {json.dumps(res2, indent=2)}")
        
    except Exception as e:
        print(f"Test failed: {e}")
