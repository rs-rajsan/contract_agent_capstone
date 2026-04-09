import asyncio
import json
import os
import sys
from typing import Any, Dict, List, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from backend.shared.utils.mcp_logger import get_mcp_logger

logger = get_mcp_logger("mcp_client")

class ContractMCPClient:
    """
    Client to interact with the ContractIntelligence MCP server.
    Enables multi-agent systems to invoke specialized retrieval tools.
    """
    
    def __init__(self):
        # Resolve the path to the server script
        base_dir = os.path.abspath(os.path.join(os.getcwd()))
        server_script = os.path.join(base_dir, "backend", "mcp_server.py")
        
        # Configure server parameters for stdio communication
        self.server_params = StdioServerParameters(
            command=sys.executable,
            args=[server_script],
            env={**os.environ, "PYTHONPATH": base_dir}
        )
        logger.info(f"Initialized MCP Client pointing to: {server_script}")

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """
        Call a specific tool on the MCP server.
        
        Args:
            tool_name: The name of the tool to invoke.
            arguments: Dictionary of arguments for the tool.
        """
        logger.info(f"Invoking tool {tool_name} via MCP Client", metadata={"arguments": arguments})
        
        try:
            async with stdio_client(self.server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(tool_name, arguments)
                    
                    if hasattr(result, 'content') and result.content:
                        # MCP tool results usually have a 'content' field which is a list of items
                        item = result.content[0]
                        text_content = item.text if hasattr(item, 'text') else str(item)
                        try:
                            return json.loads(text_content)
                        except (json.JSONDecodeError, TypeError):
                            return text_content
                    
                    return result
        except Exception as e:
            logger.error(f"Failed to call MCP tool {tool_name}", e)
            return {"success": False, "error": str(e)}

    def call_tool_sync(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Synchronous wrapper for call_tool (DRY helper for LangGraph nodes)."""
        import concurrent.futures
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    return executor.submit(asyncio.run, self.call_tool(tool_name, arguments)).result()
            return loop.run_until_complete(self.call_tool(tool_name, arguments))
        except RuntimeError:
            return asyncio.run(self.call_tool(tool_name, arguments))

# Singleton helper for easy access
_client = None

def get_mcp_client() -> ContractMCPClient:
    global _client
    if _client is None:
        _client = ContractMCPClient()
    return _client

# Export singleton instance for direct import
mcp_client = get_mcp_client()

async def main():
    """Test script for MCP Client"""
    client = get_mcp_client()
    
    # Test 1: Fetch metadata
    print("Testing fetch_contract_metadata...")
    result = await client.call_tool("fetch_contract_metadata", {
        "contract_id": "UPLOADED_TEST",
        "tenant_id": "demo_tenant_1"
    })
    print(f"Result: {json.dumps(result, indent=2)}")

if __name__ == "__main__":
    asyncio.run(main())
