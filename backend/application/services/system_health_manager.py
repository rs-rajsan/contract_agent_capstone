import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any

from backend.shared.constants.error_cd_status_master import MasterStatusCodes, get_status_metadata
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

class SystemHealthManager:
    """
    Orchestrates proactive health checks for all architectural components:
    - LLM Agents (Gemini, GPT, etc.)
    - Embedding Services
    - Neo4j Database
    """

    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager
        
    async def run_full_diagnostic(self) -> List[Dict[str, Any]]:
        """Run all system health checks in parallel"""
        start_time = time.time()
        logger.info("🚀 Starting full system diagnostic check...")

        # Define tasks for each component
        tasks = [
            self.check_llm_agents(),
            self.check_embeddings(),
            self.check_database()
        ]
        
        # Gather results (flattened list of results)
        results = await asyncio.gather(*tasks)
        
        # Flatten the results list (since check_llm_agents returns a list)
        flat_results = []
        for res in results:
            if isinstance(res, list):
                flat_results.extend(res)
            else:
                flat_results.append(res)
        
        duration = round((time.time() - start_time) * 1000, 2)
        logger.info(f"✅ System diagnostic completed in {duration}ms")
        
        return flat_results

    async def check_llm_agents(self) -> List[Dict[str, Any]]:
        """Test all configured LLM agents from the Mermaid diagram"""
        if not self.llm_manager:
            from backend.llm_manager import LLMManager
            self.llm_manager = LLMManager()

        from backend.shared.config.phase3_config import AppConfig
        agent_map = {
            "Supervisor Agent": AppConfig.DEFAULT_MODEL,
            "Upload Agent": AppConfig.DEFAULT_MODEL,
            "Planning Agent": AppConfig.DEFAULT_MODEL,
            "PDF Parser Agent": AppConfig.DEFAULT_MODEL,
            "Clause Splitter Agent": AppConfig.DEFAULT_MODEL,
            "Policy Checking Agent": AppConfig.PRO_MODEL,
            "Risk Assessment Agent": AppConfig.PRO_MODEL,
            "MCP Retrieval Agent": AppConfig.DEFAULT_MODEL,
            "Redline Generation Agent": AppConfig.PRO_MODEL,
            "Governance Agent": AppConfig.DEFAULT_MODEL,
            "Human Review Agent": AppConfig.DEFAULT_MODEL,
            "Auditor Agent": AppConfig.PRO_MODEL,
            "Output Agent": AppConfig.DEFAULT_MODEL
        }

        tasks = []
        for agent_name, model_key in agent_map.items():
            tasks.append(self._test_single_agent(agent_name, model_key))
            
        return await asyncio.gather(*tasks)

    async def _test_single_agent(self, agent_name: str, model_key: str) -> Dict[str, Any]:
        """Ping a specific model and map failure to centralized status codes"""
        start = time.time()
        try:
            llm = self.llm_manager.get_llm_instance(model_key)
            # Minimal probe
            await llm.ainvoke("ping")
            
            latency = round((time.time() - start) * 1000, 2)
            meta = get_status_metadata(MasterStatusCodes.OK)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "LLM",
                "status_code": int(MasterStatusCodes.OK),
                "error_condition": meta["error_condition"],
                "system_error": None,
                "user_facing_message": meta["user_message"],
                "latency_ms": latency
            }
        except Exception as e:
            latency = round((time.time() - start) * 1000, 2)
            error_msg = str(e)
            
            # Map common LLM errors to status codes
            code = self._map_llm_exception(error_msg)
            meta = get_status_metadata(code)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "LLM",
                "status_code": int(code),
                "error_condition": meta["error_condition"],
                "system_error": error_msg,
                "user_facing_message": meta["user_message"],
                "latency_ms": latency
            }

    async def check_embeddings(self) -> Dict[str, Any]:
        """Test the Gemini Embedding Service"""
        start = time.time()
        agent_name = "Gemini Embedding Service"
        try:
            from backend.shared.utils.gemini_embedding_service import embedding
            await embedding.generate_embedding_async("health check")
            
            latency = round((time.time() - start) * 1000, 2)
            meta = get_status_metadata(MasterStatusCodes.OK)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "embeddings",
                "status_code": int(MasterStatusCodes.OK),
                "error_condition": meta["error_condition"],
                "system_error": None,
                "user_facing_message": meta["user_message"],
                "latency_ms": latency
            }
        except Exception as e:
            latency = round((time.time() - start) * 1000, 2)
            error_msg = str(e)
            code = self._map_llm_exception(error_msg)
            meta = get_status_metadata(code)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "embeddings",
                "status_code": int(code),
                "error_condition": meta["error_condition"],
                "system_error": error_msg,
                "user_facing_message": meta["user_message"],
                "latency_ms": latency
            }

    async def check_database(self) -> Dict[str, Any]:
        """Test Neo4j Database connectivity"""
        start = time.time()
        agent_name = "Neo4j Graph Database"
        try:
            from backend.infrastructure.contract_repository import Neo4jContractRepository
            repo = Neo4jContractRepository()
            if repo.check_connection():
                latency = round((time.time() - start) * 1000, 2)
                meta = get_status_metadata(MasterStatusCodes.OK)
                return {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "agent_name": agent_name,
                    "component": "database",
                    "status_code": int(MasterStatusCodes.OK),
                    "error_condition": meta["error_condition"],
                    "system_error": None,
                    "user_facing_message": meta["user_message"],
                    "latency_ms": latency
                }
            else:
                raise ConnectionError("Database connectivity failed during check_connection")
        except Exception as e:
            latency = round((time.time() - start) * 1000, 2)
            error_msg = str(e)
            code = MasterStatusCodes.INTERNAL_ERROR
            meta = get_status_metadata(code)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "database",
                "status_code": int(code),
                "error_condition": meta["error_condition"],
                "system_error": error_msg,
                "user_facing_message": meta["user_message"],
                "latency_ms": latency
            }

    def _map_llm_exception(self, error_msg: str) -> MasterStatusCodes:
        """Heuristic mapping of raw LLM exceptions to numeric status codes"""
        msg = error_msg.lower()
        if "401" in msg or "unauthorized" in msg:
            return MasterStatusCodes.UNAUTHORIZED
        if "403" in msg or "permission" in msg:
            return MasterStatusCodes.FORBIDDEN
        if "429" in msg or "quota" in msg or "rate limit" in msg:
            return MasterStatusCodes.RATE_LIMIT
        if "404" in msg or "not found" in msg:
            return MasterStatusCodes.NOT_FOUND
        if "503" in msg or "overloaded" in msg or "busy" in msg:
            return MasterStatusCodes.MODEL_BUSY
        if "timeout" in msg:
            return MasterStatusCodes.TIMEOUT
        return MasterStatusCodes.INTERNAL_ERROR
