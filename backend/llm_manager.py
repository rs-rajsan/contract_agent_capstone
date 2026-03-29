import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_anthropic import ChatAnthropic
from langchain_mistralai import ChatMistralAI

from backend.contract_chat_agent import get_agent
from backend.shared.utils.logger import get_logger

from typing import Any

logger = get_logger(__name__)


class LLMManager:
    def __init__(self):
        self.agents = {}
        self.init_agents()

    def init_agents(self):
        # 1. OpenAI
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o")
            try:
                self.agents["gpt-4o"] = get_agent(ChatOpenAI(model=model_name, temperature=0))
                # Also index by the general name if different
                if model_name != "gpt-4o":
                    self.agents[model_name] = self.agents["gpt-4o"]
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI agent: {e}")

        # 2. Google / Gemini
        google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if google_key:
            pro_model = os.getenv("GEMINI_PRO_MODEL", "gemini-1.5-pro")
            flash_model = os.getenv("GEMINI_MODEL_DEFAULT", "gemini-2.5-flash")
            
            try:
                self.agents["gemini-1.5-pro"] = get_agent(
                    ChatGoogleGenerativeAI(model=pro_model, temperature=0)
                )
                self.agents["gemini-2.5-flash"] = get_agent(
                    ChatGoogleGenerativeAI(model=flash_model, temperature=0)
                )
                # Ensure they are accessible by both hardcoded alias and dynamic name
                self.agents[pro_model] = self.agents["gemini-1.5-pro"]
                self.agents[flash_model] = self.agents["gemini-2.5-flash"]
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini agents: {e}")

        # 3. Anthropic
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            model_name = os.getenv("ANTHROPIC_MODEL_NAME", "claude-3-5-sonnet-latest")
            try:
                self.agents["sonnet-3.5"] = get_agent(
                    ChatAnthropic(model=model_name, temperature=0)
                )
                self.agents[model_name] = self.agents["sonnet-3.5"]
            except Exception as e:
                logger.warning(f"Failed to initialize Anthropic agent: {e}")

        # 4. Mistral
        mistral_key = os.getenv("MISTRAL_API_KEY")
        if mistral_key:
            model_name = os.getenv("MISTRAL_MODEL_NAME", "mistral-large-latest")
            try:
                self.agents["mistral-large"] = get_agent(
                    ChatMistralAI(model=model_name)
                )
                self.agents[model_name] = self.agents["mistral-large"]
            except Exception as e:
                logger.warning(f"Failed to initialize Mistral agent: {e}")

        # Load default model mapping if specified
        self.default_model_name = os.getenv("BACKEND_DEFAULT_MODEL", "gemini-2.5-flash")
        
        logger.info(f"Loaded {len(self.agents)} llm internal mappings.")
        logger.info(f"Initialized LLMs: {list(self.agents.keys())}")
        logger.info(f"Default model configured: {self.default_model_name}")

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
