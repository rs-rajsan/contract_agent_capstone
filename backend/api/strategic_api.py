from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from backend.application.services.strategic_service import StrategicService
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/strategic", tags=["strategic"])

strategic_service = StrategicService()

@router.get("/insights")
async def get_strategic_insights(
    status: str = Query("All", description="Analysis status: All, Completed, Pending"),
    start_date: Optional[str] = Query(None, description="Start date (ISO)"),
    end_date: Optional[str] = Query(None, description="End date (ISO)"),
    contract_ids: Optional[List[str]] = Query(None, description="Filter by specific contract IDs")
):
    """
    Returns strategic business insights aggregated across contracts.
    """
    try:
        data = await strategic_service.get_filtered_strategic_data(
            status=status,
            start_date=start_date,
            end_date=end_date,
            contract_ids=contract_ids
        )
        return data
    except Exception as e:
        logger.error(f"Failed to fetch strategic insights: {e}")
        raise HTTPException(status_code=500, detail="Error fetching strategic dashboard data.")
