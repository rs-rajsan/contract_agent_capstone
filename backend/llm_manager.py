import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_mistralai import ChatMistralAI

from backend.contract_chat_agent import get_agent
from backend.shared.config.phase3_config import AppConfig
from backend.shared.utils.logger import get_logger
from typing import Any, Dict

logger = get_logger(__name__)


class LLMManager:
    def __init__(self):
        self.agents = {}
        self._llms = {} # Raw LangChain instances
        self.init_agents()

    def init_agents(self):
        # Configuration from centralized AppConfig
        temp = AppConfig.LLM_TEMPERATURE
        
        # 1. OpenAI
        if os.getenv("OPENAI_API_KEY"):
            model_id = AppConfig.OPENAI_MODEL
            try:
                llm = ChatOpenAI(model=model_id, temperature=temp)
                self._llms["gpt-4o"] = llm
                self.agents["gpt-4o"] = get_agent(llm)
                self.agents[model_id] = self.agents["gpt-4o"]
                self._llms[model_id] = llm
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI agent: {e}")

        # 2. Google / Gemini
        google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if google_key:
            pro_model_id = AppConfig.PRO_MODEL
            flash_model_id = AppConfig.DEFAULT_MODEL
            
            try:
                pro_llm = ChatGoogleGenerativeAI(model=pro_model_id, temperature=temp)
                flash_llm = ChatGoogleGenerativeAI(model=flash_model_id, temperature=temp)
                
                self._llms["gemini-1.5-pro"] = pro_llm
                self.agents["gemini-1.5-pro"] = get_agent(pro_llm)
                
                self._llms["gemini-2.5-flash"] = flash_llm
                self.agents["gemini-2.5-flash"] = get_agent(flash_llm)
                
                # Standard mapping
                self.agents[pro_model_id] = self.agents["gemini-1.5-pro"]
                self.agents[flash_model_id] = self.agents["gemini-2.5-flash"]
                self._llms[pro_model_id] = pro_llm
                self._llms[flash_model_id] = flash_llm
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini agents: {e}")

        # 3. Anthropic
        if os.getenv("ANTHROPIC_API_KEY"):
            model_id = AppConfig.ANTHROPIC_MODEL
            try:
                llm = ChatAnthropic(model=model_id, temperature=temp)
                self._llms["sonnet-3.5"] = llm
                self.agents["sonnet-3.5"] = get_agent(llm)
                self.agents[model_id] = self.agents["sonnet-3.5"]
                self._llms[model_id] = llm
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic agent: {e}")

        # 4. Mistral
        if os.getenv("MISTRAL_API_KEY"):
            model_id = AppConfig.MISTRAL_MODEL
            try:
                llm = ChatMistralAI(model=model_id, temperature=temp)
                self._llms["mistral-large"] = llm
                self.agents["mistral-large"] = get_agent(llm)
                self.agents[model_id] = self.agents["mistral-large"]
                self._llms[model_id] = llm
            except Exception as e:
                logger.warning(f"Failed to initialize Mistral agent: {e}")

        # Load default model mapping
        self.default_model_name = AppConfig.DEFAULT_MODEL
        
        logger.info(f"Loaded {len(self.agents)} llm agents and raw instances.")
        logger.info(f"Initialized LLMs: {list(self.agents.keys())}")
        logger.info(f"Default model configured: {self.default_model_name}")

    def get_llm_instance(self, name: str):
        """Get raw LangChain LLM instance by name with fallback"""
        target_name = name or self.default_model_name
        if target_name in self._llms:
            return self._llms[target_name]
        
        # Fallback
        if self.default_model_name in self._llms:
            logger.warning(f"LLM '{target_name}' not found, falling back to '{self.default_model_name}'")
            return self._llms[self.default_model_name]
            
        raise ValueError(f"No LLM instances available.")

    def get_model_by_name(self, name: str = None):
        """Get model by name, or return default if no name provided."""
        target_name = name or self.default_model_name
        try:
            return self.agents[target_name]
        except KeyError:
            # If specified name fails, try default
            if target_name != self.default_model_name:
                logger.warning(f"Model {target_name} not found, falling back to {self.default_model_name}")
                return self.agents.get(self.default_model_name)
            raise ValueError(f"The model {target_name} (default) wasn't initiated. Available: {list(self.agents.keys())}")
