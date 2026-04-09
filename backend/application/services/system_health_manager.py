import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any

from backend.shared.constants.status_codes import SystemStatusCodes, get_status_metadata
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
            "PDF Processing Agent": AppConfig.DEFAULT_MODEL,
            "Clause Extraction Agent": AppConfig.DEFAULT_MODEL,
            "Risk Assessment Agent": AppConfig.PRO_MODEL,
            "Intelligent Chunking Agent": AppConfig.DEFAULT_MODEL,
            "Policy Enforcement Agent": AppConfig.PRO_MODEL,
            "Supervisor Agent": AppConfig.DEFAULT_MODEL
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
            meta = get_status_metadata(SystemStatusCodes.OK)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "LLM",
                "status_code": int(SystemStatusCodes.OK),
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
            meta = get_status_metadata(SystemStatusCodes.OK)
            
            return {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "agent_name": agent_name,
                "component": "embeddings",
                "status_code": int(SystemStatusCodes.OK),
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
                meta = get_status_metadata(SystemStatusCodes.OK)
                return {
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    "agent_name": agent_name,
                    "component": "database",
                    "status_code": int(SystemStatusCodes.OK),
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
            code = SystemStatusCodes.INTERNAL_ERROR
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

    def _map_llm_exception(self, error_msg: str) -> SystemStatusCodes:
        """Heuristic mapping of raw LLM exceptions to numeric status codes"""
        msg = error_msg.lower()
        if "401" in msg or "unauthorized" in msg:
            return SystemStatusCodes.UNAUTHORIZED
        if "403" in msg or "permission" in msg:
            return SystemStatusCodes.FORBIDDEN
        if "429" in msg or "quota" in msg or "rate limit" in msg:
            return SystemStatusCodes.RATE_LIMIT
        if "404" in msg or "not found" in msg:
            return SystemStatusCodes.NOT_FOUND
        if "503" in msg or "overloaded" in msg or "busy" in msg:
            return SystemStatusCodes.MODEL_BUSY
        if "timeout" in msg:
            return SystemStatusCodes.TIMEOUT
        return SystemStatusCodes.INTERNAL_ERROR
