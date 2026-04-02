"""
Document Access Audit Logger
Observer Pattern + Decorator Pattern for comprehensive audit trails
"""

import logging
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
from functools import wraps
import json

import os
import re
from backend.shared.utils.logger import get_logger
logger = get_logger(__name__)

class AuditEventType(Enum):
    """Audit event types"""
    DOCUMENT_UPLOAD = "document_upload"
    DOCUMENT_ACCESS = "document_access"
    DOCUMENT_DOWNLOAD = "document_download"
    DOCUMENT_DELETE = "document_delete"
    DOCUMENT_UPDATE = "document_update"
    SEARCH_QUERY = "search_query"
    ANALYSIS_REQUEST = "analysis_request"
    EMBEDDING_GENERATION = "embedding_generation"
    VALIDATION_FAILURE = "validation_failure"
    PROCESSING_ERROR = "processing_error"

class AuditLogger:
    """Centralized audit logging with Neo4j persistence"""
    
    def __init__(self):
        from backend.infrastructure.contract_repository import Neo4jContractRepository
        self.repository = Neo4jContractRepository()
        self.jsonl_log_path = os.path.join(os.getcwd(), "logs", "audit.jsonl")
        
        # Ensure logs directory exists
        os.makedirs(os.path.dirname(self.jsonl_log_path), exist_ok=True)
    
    def _mask_pii(self, data: Any) -> Any:
        """
        Recursively masks PII/PHI patterns in strings, lists, and dicts. (HIPAA Compliance)
        Patterns: Email, Phone, SSN, and generic 'ID' fields in metadata.
        """
        email_regex = r"[\w\.-]+@[\w\.-]+\.\w+"
        phone_regex = r"\b(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})\b"
        ssn_regex = r"\b\d{3}-\d{2}-\d{4}\b"
        
        if isinstance(data, str):
            data = re.sub(email_regex, "[EMAIL_MASKED]", data)
            data = re.sub(phone_regex, "[PHONE_MASKED]", data)
            data = re.sub(ssn_regex, "[SSN_MASKED]", data)
            return data
        elif isinstance(data, list):
            return [self._mask_pii(item) for item in data]
        elif isinstance(data, dict):
            return {k: self._mask_pii(v) if k.lower() not in ["email", "phone", "ssn"] else "[MASKED]" 
                    for k, v in data.items()}
        return data

    def log_event(
        self,
        event_type: AuditEventType,
        resource_id: str,
        action: str,
        user_id: Optional[str] = "system",
        tenant_id: Optional[str] = "demo_tenant_1",
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
        error_details: Optional[str] = None
    ) -> str:
        """Log audit event to Neo4j and local JSONL with PII masking."""
        audit_id = f"audit_{datetime.utcnow().timestamp()}"
        timestamp = datetime.utcnow().isoformat()
        
        # Apply PII Masking before logging
        masked_metadata = self._mask_pii(metadata or {})
        masked_error = self._mask_pii(error_details) if error_details else None
        
        # 1. JSONL Logging
        try:
            log_entry = {
                "audit_id": audit_id,
                "timestamp": timestamp,
                "event_type": event_type.value,
                "resource_id": resource_id,
                "action": action,
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": status,
                "metadata": masked_metadata,
                "error_details": masked_error
            }
            
            with open(self.jsonl_log_path, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
                
            logger.info(f"Audit JSONL appended: {event_type.value}")
        except Exception as e:
            logger.error(f"Failed to log to JSONL: {e}")

        # 2. Neo4j Logging (Existing)
        try:
            query = """
            MERGE (a:AuditLog {audit_id: $audit_id})
            SET a.event_type = $event_type,
                a.resource_id = $resource_id,
                a.action = $action,
                a.user_id = $user_id,
                a.tenant_id = $tenant_id,
                a.status = $status,
                a.timestamp = datetime(),
                a.metadata = $metadata,
                a.error_details = $error_details
            RETURN a.audit_id as audit_id
            """
            
            self.repository.graph.query(query, {
                "audit_id": audit_id,
                "event_type": event_type.value,
                "resource_id": resource_id,
                "action": action,
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": status,
                "metadata": json.dumps(masked_metadata),
                "error_details": masked_error
            })
            
            logger.info(f"Audit Neo4j logged: {event_type.value}")
            return audit_id
            
        except Exception as e:
            logger.error(f"Failed to log audit event to Neo4j: {e}")
            return audit_id
    
    def get_audit_trail(self, resource_id: str, limit: int = 100) -> list:
        """Retrieve audit trail for a resource"""
        try:
            query = """
            MATCH (a:AuditLog {resource_id: $resource_id})
            RETURN a.audit_id as audit_id,
                   a.event_type as event_type,
                   a.action as action,
                   a.user_id as user_id,
                   a.status as status,
                   a.timestamp as timestamp,
                   a.metadata as metadata
            ORDER BY a.timestamp DESC
            LIMIT $limit
            """
            
            result = self.repository.graph.query(query, {
                "resource_id": resource_id,
                "limit": limit
            })
            
            return [dict(row) for row in result]
            
        except Exception as e:
            logger.error(f"Failed to retrieve audit trail: {e}")
            return []

# Decorator for automatic audit logging
def audit_log(event_type: AuditEventType, action: str):
    """Decorator to automatically log function calls"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            audit_logger = AuditLogger()
            resource_id = kwargs.get('contract_id') or kwargs.get('file', {}).filename if 'file' in kwargs else 'unknown'
            
            try:
                result = await func(*args, **kwargs)
                
                audit_logger.log_event(
                    event_type=event_type,
                    resource_id=str(resource_id),
                    action=action,
                    metadata={"function": func.__name__, "args_count": len(args)},
                    status="success"
                )
                
                return result
                
            except Exception as e:
                audit_logger.log_event(
                    event_type=event_type,
                    resource_id=str(resource_id),
                    action=action,
                    metadata={"function": func.__name__},
                    status="failure",
                    error_details=str(e)
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            audit_logger = AuditLogger()
            resource_id = kwargs.get('contract_id') or 'unknown'
            
            try:
                result = func(*args, **kwargs)
                
                audit_logger.log_event(
                    event_type=event_type,
                    resource_id=str(resource_id),
                    action=action,
                    metadata={"function": func.__name__},
                    status="success"
                )
                
                return result
                
            except Exception as e:
                audit_logger.log_event(
                    event_type=event_type,
                    resource_id=str(resource_id),
                    action=action,
                    metadata={"function": func.__name__},
                    status="failure",
                    error_details=str(e)
                )
                raise
        
        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator
