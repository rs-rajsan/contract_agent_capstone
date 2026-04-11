from backend.domain.entities import DocumentProcessingRequest
from backend.agents.pdf_processing_agent import PDFAgentFactory
from backend.domain.value_objects import ProcessingResult, ProcessingStatus
from backend.agents.agent_workflow_tracker import workflow_tracker
from backend.embeddings.orchestrator import EmbeddingOrchestrator
from backend.embeddings.validator import EmbeddingValidator
from backend.application.services.document_processing_service import DEFAULT_MODEL, MODEL_ALIAS_MAP
from backend.shared.utils.graph_utils import get_graph
import os
import logging

from backend.shared.utils.logger import get_logger
from backend.agents.auditor_agent import AuditorAgent

from backend.infrastructure.contract_repository import Neo4jContractRepository

logger = get_logger(__name__)

class EnhancedDocumentProcessingService:
    """
    Enhanced document processing service with multi-level embeddings
    and Agentic Self-Reflection.
    """
    
    def __init__(self, agent_manager):
        self.agent_manager = agent_manager
        self.pdf_agent_factory = PDFAgentFactory()
        self.embedding_orchestrator = EmbeddingOrchestrator()
        self.embedding_validator = EmbeddingValidator()
        self.contract_repo = Neo4jContractRepository() # SOLID Repository
        self.auditor = AuditorAgent() # Integrated Auditor Agent
    
    def process_pdf_with_embeddings(self, request: DocumentProcessingRequest) -> dict:
        """
        Process uploaded PDF with enhanced multi-level embeddings
        and integrated self-reflection auditing.
        """
        
        try:
            logger.info(f"Starting enhanced PDF processing for: {request.filename}")
            
            # 1. Validate file exists
            if not os.path.exists(request.file_path):
                raise FileNotFoundError(f"File not found: {request.file_path}")
            
            # 2. Get appropriate LLM model
            model_name = request.processing_options.get("model", DEFAULT_MODEL)
            llm = self._get_llm_for_model(model_name)
            
            # 3. Create PDF processing agent
            pdf_agent = self.pdf_agent_factory.create_agent(llm)
            
            # 4. Process document using agent
            result = self._process_with_enhanced_embeddings(pdf_agent, request)
            
            # 5. Clean up temporary file
            self._cleanup_file(request.file_path)
            
            logger.info(f"Enhanced PDF processing completed for: {request.filename}")
            return result
            
        except Exception as e:
            logger.error(f"Enhanced PDF processing failed for {request.filename}: {e}")
            self._cleanup_file(request.file_path)
            raise
    
    def _get_llm_for_model(self, model_name: str):
        """Get LLM instance — uses MODEL_ALIAS_MAP from environment (DRY, env-driven)"""
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
    
    def _process_with_enhanced_embeddings(self, pdf_agent, request: DocumentProcessingRequest) -> dict:
        """Process document with enhanced embeddings"""
        
        # Start workflow tracking
        workflow_tracker.start_workflow()
        
        # Track PDF processing agent
        pdf_execution = workflow_tracker.start_agent(
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
        
        logger.info("Starting PDF agent processing with enhanced embeddings")
        
        try:
            # Run the PDF agent workflow
            final_state = pdf_agent.invoke(initial_state)
            processing_result = final_state.get("processing_result")
            extracted_text = final_state.get("extracted_text", "")
            
            if not processing_result or not processing_result.contract_id:
                workflow_tracker.error_agent(pdf_execution, "PDF processing failed")
                workflow_tracker.complete_workflow()
                return {
                    "status": "error",
                    "filename": request.filename,
                    "final_result": "PDF processing failed",
                    "contract_id": None
                }
            
            # Complete PDF processing
            workflow_tracker.complete_agent(pdf_execution, f"Contract stored with ID: {processing_result.contract_id}")
            
            # Process enhanced embeddings
            embedding_success = self._process_enhanced_embeddings(
                processing_result.contract_id, 
                extracted_text,
                request.filename
            )
            
            # 5. Auditor Self-Reflection Step (New Agentic Pattern)
            auditor_execution = workflow_tracker.start_agent(
                "Self-Correction Auditor",
                "Verify graph integrity and agentic consistency",
                f"Contract ID: {processing_result.contract_id}"
            )
            
            # Aggregate all results for auditing
            combined_state = {
                **final_state,
                "embedding_success": embedding_success
            }
            
            audit_results = self.auditor.audit_processing_results(
                processing_result.contract_id, 
                combined_state
            )
            
            if audit_results["is_valid"]:
                workflow_tracker.complete_agent(auditor_execution, audit_results["reflections"][0])
            else:
                workflow_tracker.error_agent(auditor_execution, f"Audit issues detected: {audit_results['issues'][0]}")
            
            workflow_tracker.complete_workflow()
            
            # Return enhanced result
            return {
                "status": processing_result.status.value,
                "filename": request.filename,
                "final_result": f"Processing {processing_result.status.value} with enhanced embeddings (Audit: {'Pass' if audit_results['is_valid'] else 'Warning'})",
                "contract_id": processing_result.contract_id,
                "enhanced_embeddings": embedding_success,
                "audit_confidence": audit_results["confidence_score"],
                "error": processing_result.error
            }
            
        except Exception as e:
            workflow_tracker.error_agent(pdf_execution, f"Processing failed: {str(e)}")
            workflow_tracker.complete_workflow()
            logger.error(f"Enhanced processing failed: {e}")
            return {
                "status": "error",
                "filename": request.filename,
                "final_result": f"Enhanced processing failed: {str(e)}",
                "contract_id": None
            }
    
    def _process_enhanced_embeddings(self, contract_id: str, extracted_text: str, filename: str) -> bool:
        """Process multi-level embeddings for uploaded contract"""
        
        # Track embedding processing
        embedding_execution = workflow_tracker.start_agent(
            "Enhanced Embedding Agent",
            "Generate multi-level embeddings (document, section, clause, relationship)",
            f"Contract ID: {contract_id}"
        )
        
        try:
            logger.info(f"Processing enhanced embeddings for contract: {contract_id}")
            
            if not extracted_text or len(extracted_text.strip()) < 50:
                workflow_tracker.error_agent(embedding_execution, "Insufficient text for embedding processing")
                return False
            
            # Process with orchestrator
            processing_result = self.embedding_orchestrator.process_document(
                content=extracted_text,
                metadata={"file_id": contract_id, "source": "upload", "filename": filename}
            )
            
            # Validate results
            all_embeddings = (
                processing_result.document_embeddings + 
                processing_result.clause_embeddings + 
                processing_result.relationship_embeddings
            )
            
            if not all_embeddings:
                workflow_tracker.error_agent(embedding_execution, "No embeddings generated")
                return False
            
            validation_result = self.embedding_validator.validate_embeddings(all_embeddings)
            
            if not validation_result.is_valid:
                workflow_tracker.error_agent(embedding_execution, f"Validation failed: {validation_result.errors}")
                return False
            
            # Store embeddings using Repository (SOLID SRP)
            self.contract_repo.update_enhanced_embeddings(contract_id, processing_result)
            
            workflow_tracker.complete_agent(
                embedding_execution, 
                f"Generated {len(all_embeddings)} embeddings: {len(processing_result.document_embeddings)} doc, {len(processing_result.clause_embeddings)} clause, {len(processing_result.relationship_embeddings)} relationship"
            )
            
            logger.info(f"Enhanced embeddings processed successfully for contract: {contract_id}")
            return True
            
        except Exception as e:
            workflow_tracker.error_agent(embedding_execution, f"Embedding processing failed: {str(e)}")
            logger.error(f"Enhanced embedding processing failed for {contract_id}: {e}")
            return False
    
    def _cleanup_file(self, file_path: str):
        """Clean up temporary uploaded file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temporary file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup file {file_path}: {e}")
            return False

class EnhancedDocumentServiceFactory:
    """Factory for creating enhanced document processing services"""
    
    @staticmethod
    def create_service(agent_manager):
        """Create enhanced document processing service with dependencies"""
        return EnhancedDocumentProcessingService(agent_manager)