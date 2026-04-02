from typing import TypedDict, Optional
from backend.domain.value_objects import ProcessingResult, ContractData

class PDFProcessingState(TypedDict):
    file_path: str
    extracted_text: Optional[str]
    contract_data: Optional[ContractData]
    processing_result: Optional[ProcessingResult]
    messages: list
    # Enhanced state fields
    sections: Optional[list]
    clauses: Optional[list]
    cuad_classifications: Optional[list]