from fastapi import APIRouter, HTTPException
from backend.application.services.kpi_service import KPIService
from backend.application.services.governance_service import GovernanceService
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])

# Instantiate the services
kpi_service = KPIService()
governance_service = GovernanceService()

@router.get("/kpis")
async def get_kpis():
    """
    Returns high-level executive KPIs aggregated from the system logs.
    """
    try:
        summary = await kpi_service.get_executive_summary()
        return summary
    except Exception as e:
        logger.error(f"Failed to fetch KPIs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching analytics.")

@router.get("/governance")
async def get_governance():
    """
    Returns governance and user activity metrics aggregated from audit.jsonl.
    """
    try:
        metrics = await governance_service.get_governance_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Failed to fetch governance data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error fetching governance logs.")

@router.get("/health")
async def get_analytics_health():
    """
    Verify that the log file is accessible and readable.
    """
    import os
    return {
        "log_path": kpi_service.log_path,
        "exists": os.path.exists(kpi_service.log_path),
        "service": "KPIService Online"
    }
