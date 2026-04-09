from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any
from ..agents.supervisor.supervisor_agent import SupervisorFactory, WorkflowRequest
from ..llm_manager import LLMManager
import logging

from backend.shared.utils.logger import get_logger
logger = get_logger(__name__)

router = APIRouter(prefix="/api/supervisor", tags=["supervisor"])

def get_supervisor(request: Request):
    """Dependency to retrieve the persistent supervisor from app state"""
    return request.app.state.supervisor

@router.post("/workflow/execute")
async def execute_workflow(
    workflow_data: Dict[str, Any],
    supervisor = Depends(get_supervisor)
):
    """Execute supervised workflow using the persistent supervisor instance"""
    try:
        # Create workflow request
        request = WorkflowRequest(
            workflow_id=workflow_data.get("workflow_id", "default"),
            workflow_type=workflow_data.get("workflow_type", "contract_analysis"),
            input_data=workflow_data.get("input_data", {})
        )
        
        # Execute workflow
        result = supervisor.coordinate_workflow(request)
        
        return {
            "success": True,
            "workflow_id": result.workflow_id,
            "status": result.status,
            "results": result.results,
            "summary": result.summary
        }
        
    except Exception as e:
        logger.error(f"Supervisor workflow failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflow/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    supervisor = Depends(get_supervisor)
):
    """Get real-time workflow status from the persistent supervisor state"""
    try:
        status = supervisor.get_workflow_status(workflow_id)
        if "error" in status:
            raise HTTPException(status_code=404, detail=status["error"])
        return {"success": True, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch status for {workflow_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))