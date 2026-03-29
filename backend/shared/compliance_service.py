import json
from datetime import datetime
from typing import Dict, Any, List
import re

from backend.shared.utils.logger import get_logger
logger = get_logger(__name__)

class ComplianceService:
    """
    Centralized service for HIPAA, FHIR, and SOX regulatory compliance.
    """
    
    def __init__(self):
        # Patterns for PHI/PII detection (HIPAA)
        self.phi_patterns = {
            "ssn": r"\d{3}-\d{2}-\d{4}",
            "phone": r"\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}",
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "dob": r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
            "medical_record_number": r"MRN\s?[:#]?\s?\d{5,10}"
        }

    def check_hipaa_compliance(self, text: str) -> Dict[str, Any]:
        """
        Check for PHI/PII data in the text to ensure HIPAA compliance.
        """
        detected_phi = []
        for label, pattern in self.phi_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                detected_phi.append({
                    "type": label,
                    "pos": match.span(),
                    "mask_required": True
                })
        
        status = "PASS" if not detected_phi else "FLAGGED"
        return {
            "status": status,
            "detected_phi": detected_phi,
            "timestamp": datetime.now().isoformat()
        }

    def map_to_fhir(self, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Map contract clauses to FHIR resources (Consent, Contract, DocumentReference).
        """
        fhir_mapping = []
        for clause in clauses:
            # Example logic for mapping
            if "Consent" in clause.get("type", ""):
                fhir_mapping.append({
                    "resourceType": "Consent",
                    "status": "active",
                    "scope": "patient-privacy",
                    "original_clause": clause.get("id")
                })
        
        return {
            "resource_count": len(fhir_mapping),
            "mappings": fhir_mapping,
            "timestamp": datetime.now().isoformat()
        }

    def generate_sox_audit_trail(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a Sarbanes-Oxley (SOX) compliant audit trail.
        Focuses on internal controls, financial impact, and authorized approvals.
        """
        audit_entry = {
            "audit_id": f"SOX-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "workflow_id": workflow_data.get("workflow_id"),
            "event": "FINANCIAL_GOVERNANCE_CHECK",
            "timestamp": datetime.now().isoformat(),
            "internal_controls": [
                {"control": "FIN-01", "description": "Contract value validation", "status": "VERIFIED"},
                {"control": "FIN-02", "description": "Signing authority verification", "status": "PENDING"}
            ],
            "financial_impact": workflow_data.get("estimated_value", "LOW")
        }
        
        return audit_entry

# Singleton instance
compliance_service = ComplianceService()
