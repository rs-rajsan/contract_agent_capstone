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
        self._repository = None
    
    @property
    def repository(self):
        if self._repository is None:
            from backend.infrastructure.contract_repository import Neo4jContractRepository
            self._repository = Neo4jContractRepository()
        return self._repository
    
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
        """Log audit event to Neo4j with high resilience"""
        try:
            audit_id = f"audit_{datetime.utcnow().timestamp()}"
            
            # Robust property access (catches initialization errors)
            try:
                repo = self.repository
                if not repo or not hasattr(repo, 'graph'):
                    logger.warning("Audit repository unavailable, falling back to local logs only")
                    return audit_id
            except Exception as repo_err:
                logger.warning(f"Failed to initialize audit repository: {repo_err}")
                return audit_id

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
            
            result = repo.graph.query(query, {
                "audit_id": audit_id,
                "event_type": event_type.value,
                "resource_id": resource_id,
                "action": action,
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": status,
                "metadata": json.dumps(metadata or {}),
                "error_details": error_details
            })
            
            logger.info(f"Audit logged: {event_type.value} - {resource_id} - {status}")
            return result[0]["audit_id"] if result else audit_id
            
        except Exception as e:
            # Final fallback: never allow audit logging to crash the primary request
            logger.error(f"Audit logging failed silently: {e}")
            return ""
    
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
