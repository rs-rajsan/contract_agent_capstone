import os
from typing import Any
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_mistralai import ChatMistralAI
from backend.contract_chat_agent import get_agent
from backend.shared.config.phase3_config import AppConfig

class LLMManager:
    agents = {}

    def __init__(self):
        self.init_agents()

    def init_agents(self):
        # Configuration from centralized AppConfig
        temp = AppConfig.LLM_TEMPERATURE
        self._llms = {} # Store raw LangChain LLM instances
        
        # OpenAI
        if os.getenv("OPENAI_API_KEY"):
            model_id = AppConfig.OPENAI_MODEL
            llm = ChatOpenAI(model=model_id, temperature=temp)
            self._llms["gpt-4o"] = llm
            self.agents["gpt-4o"] = get_agent(llm)

        # Google / Gemini
        if os.getenv("GOOGLE_API_KEY"):
            pro_model_id = AppConfig.PRO_MODEL
            flash_model_id = AppConfig.DEFAULT_MODEL
            
            pro_llm = ChatGoogleGenerativeAI(model=pro_model_id, temperature=temp)
            flash_llm = ChatGoogleGenerativeAI(model=flash_model_id, temperature=temp)
            
            self._llms["gemini-2.5-pro"] = pro_llm
            self.agents["gemini-2.5-pro"] = get_agent(pro_llm)
            
            self._llms["gemini-2.5-flash"] = flash_llm
            self.agents["gemini-2.5-flash"] = get_agent(flash_llm)

        # Anthropic
        if os.getenv("ANTHROPIC_API_KEY"):
            model_id = AppConfig.ANTHROPIC_MODEL
            llm = ChatAnthropic(model=model_id, temperature=temp)
            self._llms["sonnet-3.5"] = llm
            self.agents["sonnet-3.5"] = get_agent(llm)

        # Mistral
        if os.getenv("MISTRAL_API_KEY"):
            model_id = AppConfig.MISTRAL_MODEL
            llm = ChatMistralAI(model=model_id, temperature=temp)
            self._llms["mistral-large"] = llm
            self.agents["mistral-large"] = get_agent(llm)
        
        print(f"Loaded {len(self.agents)} llm agents and raw instances.")

    def get_agent(self, name: str):
        """Get agent by name with fallback to default model"""
        if name in self.agents:
            return self.agents[name]
        
        # Fallback logic for Agentic flexibility
        default_key = self._get_default_key()
        if default_key and default_key in self.agents:
            print(f"Agent '{name}' not found, falling back to '{default_key}'")
            return self.agents[default_key]
            
        raise ValueError(f"No agents available, not even fallback.")

    def get_llm_instance(self, name: str):
        """Get raw LangChain LLM instance by name with fallback"""
        if hasattr(self, '_llms') and name in self._llms:
            return self._llms[name]
            
        # Fallback logic
        default_key = self._get_default_key()
        if default_key and hasattr(self, '_llms') and default_key in self._llms:
            print(f"LLM '{name}' not found, falling back to '{default_key}'")
            return self._llms[default_key]
            
        raise ValueError(f"No LLM instances available.")

    def _get_default_key(self) -> str:
        """Centralized mapping for default model keys"""
        if "gemini-2.5-flash" in self.agents: return "gemini-2.5-flash"
        if "gpt-4o" in self.agents: return "gpt-4o"
        return list(self.agents.keys())[0] if self.agents else ""

    def get_model_by_name(self, name: str):
        # Deprecated: use get_agent or get_llm_instance instead
        return self.get_agent(name)
