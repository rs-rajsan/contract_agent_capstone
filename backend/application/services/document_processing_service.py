from backend.domain.entities import DocumentProcessingRequest
from backend.agents.pdf_processing_agent import PDFAgentFactory
from backend.domain.value_objects import ProcessingResult, ProcessingStatus
from backend.agents.agent_workflow_tracker import workflow_tracker
from backend.embeddings.orchestrator import EmbeddingOrchestrator
from backend.embeddings.validator import EmbeddingValidator
import os
import json

from backend.shared.utils.logger import get_logger
logger = get_logger(__name__)

# Module-level constants sourced from environment — single source of truth
DEFAULT_MODEL = os.getenv("BACKEND_DEFAULT_MODEL", "gemini-2.5-flash")
_alias_map_raw = os.getenv("MODEL_ALIAS_MAP", "{}")
try:
    MODEL_ALIAS_MAP: dict = json.loads(_alias_map_raw)
except json.JSONDecodeError:
    logger.warning("MODEL_ALIAS_MAP env var is not valid JSON; falling back to empty map.")
    MODEL_ALIAS_MAP = {}

class DocumentProcessingService:
    """
    Application Service for document processing
    Follows Single Responsibility Principle with structured output
    """
    
    def __init__(self, agent_manager):
        self.agent_manager = agent_manager
        self.pdf_agent_factory = PDFAgentFactory()
        self.embedding_orchestrator = EmbeddingOrchestrator()
        self.embedding_validator = EmbeddingValidator()
    
    def process_pdf_upload(self, request: DocumentProcessingRequest) -> dict:
        """
        Process uploaded PDF using agent-based workflow with structured output
        """
        
        try:
            logger.info(f"Starting PDF processing for: {request.filename}")
            
            # 1. Validate file exists
            if not os.path.exists(request.file_path):
                raise FileNotFoundError(f"File not found: {request.file_path}")
            
            # 2. Get appropriate LLM model
            model_name = request.processing_options.get("model", DEFAULT_MODEL)
            llm = self._get_llm_for_model(model_name)
            
            # 3. Create PDF processing agent
            pdf_agent = self.pdf_agent_factory.create_agent(llm)
            
            # 4. Process document using agent with structured state
            result = self._process_with_agent(pdf_agent, request)
            
            # 5. Clean up temporary file
            self._cleanup_file(request.file_path)
            
            logger.info(f"PDF processing completed for: {request.filename}")
            return result
            
        except Exception as e:
            logger.error(f"PDF processing failed for {request.filename}: {e}")
            self._cleanup_file(request.file_path)
            raise
    
    def _get_llm_for_model(self, model_name: str):
        """Get LLM instance — uses MODEL_ALIAS_MAP from environment (DRY, env-driven)"""
        # Resolve alias to canonical model name
        canonical = MODEL_ALIAS_MAP.get(model_name, model_name)

        if model_name == "gpt-4o" or canonical == "gpt-4o":
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(model=canonical, temperature=0)
        elif canonical.startswith("gemini"):
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(model=canonical, temperature=0)
        elif model_name == "sonnet-3.5" or canonical.startswith("claude"):
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(model=canonical, temperature=0)
        elif model_name == "mistral-large" or canonical.startswith("mistral"):
            from langchain_mistralai import ChatMistralAI
            return ChatMistralAI(model=canonical)
        else:
            logger.warning(f"Unknown model '{model_name}', falling back to default '{DEFAULT_MODEL}'")
            return self._get_llm_for_model(DEFAULT_MODEL)
    
    def _process_with_agent(self, pdf_agent, request: DocumentProcessingRequest) -> dict:
        """Process document using PDF agent with structured output"""
        
        # Start workflow tracking
        workflow_tracker.start_workflow()
        
        # Track PDF processing agent
        execution = workflow_tracker.start_agent(
            "PDF Processing Agent",
            "Extract text and analyze contract structure from PDF",
            f"PDF file: {request.filename}"
        )
        
        # Create initial state
        initial_state = {
            "file_path": request.file_path,
            "extracted_text": None,
            "contract_data": None,
            "processing_result": None,
            "messages": []
        }
        
        logger.info("Starting PDF agent processing with structured state")
        
        try:
            # Run the agent workflow
            final_state = pdf_agent.invoke(initial_state)
            processing_result = final_state.get("processing_result")
            
            if not processing_result:
                # Fallback: check if we have contract_data but no result
                contract_data = final_state.get("contract_data")
                if contract_data and contract_data.is_contract:
                    workflow_tracker.error_agent(execution, "Processing completed but storage failed")
                    workflow_tracker.complete_workflow()
                    return {
                        "status": "error",
                        "filename": request.filename,
                        "final_result": "Processing completed but storage failed",
                        "contract_id": None
                    }
                workflow_tracker.error_agent(execution, "No processing result returned")
                workflow_tracker.complete_workflow()
                return {
                    "status": "error",
                    "filename": request.filename,
                    "final_result": "No processing result returned",
                    "contract_id": None
                }
            
            # Process multi-level embeddings if contract was successfully stored
            if processing_result and processing_result.contract_id:
                try:
                    # Get extracted text for embedding processing
                    extracted_text = final_state.get("extracted_text", "")
                    if extracted_text:
                        self._process_enhanced_embeddings(
                            processing_result.contract_id, 
                            extracted_text
                        )
                except Exception as e:
                    logger.warning(f"Enhanced embedding processing failed: {e}")
                
                workflow_tracker.complete_agent(execution, f"Contract stored with ID: {processing_result.contract_id}")
            else:
                workflow_tracker.error_agent(execution, "Failed to store contract")
            
            workflow_tracker.complete_workflow()
            
            # Convert structured result to response format
            return {
                "status": processing_result.status.value,
                "filename": request.filename,
                "final_result": processing_result.message or f"Processing {processing_result.status.value}",
                "contract_id": processing_result.contract_id,
                "error": processing_result.error
            }
            
        except Exception as e:
            workflow_tracker.error_agent(execution, f"Processing failed: {str(e)}")
            workflow_tracker.complete_workflow()
            logger.error(f"Agent processing failed: {e}")
            return {
                "status": "error",
                "filename": request.filename,
                "final_result": f"Processing failed: {str(e)}",
                "contract_id": None
            }
    
    def _cleanup_file(self, file_path: str):
        """Clean up temporary uploaded file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup file {file_path}: {e}")

class DocumentServiceFactory:
    """Factory for creating document processing services"""
    
    @staticmethod
    def create_service(agent_manager):
        """Create document processing service with dependencies"""
        return DocumentProcessingService(agent_manager)