import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

class BaseAnalyticsService:
    """
    Base class for all analytical services following SOLID/DRY principles.
    Handles shared logic for log path resolution, temporal filtering, and data extrapolation.
    """
    
    def __init__(self, log_filename: str):
        self.log_filename = log_filename
        self.log_path = self._resolve_log_path()

    def _resolve_log_path(self) -> str:
        """Dynamically resolve the absolute path to the log file."""
        current_file = os.path.abspath(__file__)
        # services -> application -> backend -> root
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
        return os.path.join(root_dir, "logs", self.log_filename)

    def _parse_range(self, range_str: str) -> int:
        """Convert range string to integer days."""
        mapping = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}
        return mapping.get(range_str.lower(), 30)

    def _get_date_bounds(self, range_str: str, start_date: str = None, end_date: str = None):
        """
        Calculate start and end date boundaries for log filtering.
        Supports presets (24h, 7d, etc.) and custom ISO date ranges.
        """
        now = datetime.utcnow()
        if range_str == "custom" and start_date and end_date:
            try:
                start_dt = datetime.fromisoformat(start_date)
                end_dt = datetime.fromisoformat(end_date)
                # Ensure end_dt includes the full day
                if end_dt.hour == 0 and end_dt.minute == 0:
                    end_dt = end_dt.replace(hour=23, minute=59, second=59)
                
                days_limit = max(1, (end_dt - start_dt).days)
                return start_dt, end_dt, days_limit
            except ValueError as e:
                logger.error(f"Invalid custom dates: {start_date}, {end_date}. Defaulting to 30d. Info: {e}")
                range_str = "30d"

        days_limit = self._parse_range(range_str)
        start_dt = now - timedelta(days=days_limit)
        return start_dt, now, days_limit

    def _is_extrapolated(self, daily_engagement: set, days_limit: int) -> bool:
        """
        Determine if the current dataset is sparse compared to the requested range.
        Uses an 80% threshold for data availability.
        """
        if days_limit <= 1:
            return False
            
        available_days = len(daily_engagement)
        return available_days < (days_limit * 0.8)

    def _scale_metrics(self, data: Dict[str, Any], baseline_24h: Dict[str, Any], fields: List[str], days_limit: int, is_extrapolated: bool) -> Dict[str, Any]:
        """
        Apply extrapolation scaling to a set of fields based on the 24h baseline.
        """
        scaled = data.copy()
        if is_extrapolated:
            for field in fields:
                baseline_val = baseline_24h.get(field, 0)
                scaled[f"total_{field}"] = baseline_val * days_limit
                
        return scaled

    def _get_empty_summary(self) -> Dict[str, Any]:
        """Default empty summary state to prevent UI crashes."""
        return {
            "is_extrapolated": False
        }
