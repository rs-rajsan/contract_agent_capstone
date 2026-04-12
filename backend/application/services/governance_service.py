import json
import os
from collections import Counter
from datetime import datetime, timedelta
from typing import Dict, Any, List
from backend.shared.utils.logger import get_logger
from backend.application.services.base_analytics_service import BaseAnalyticsService

logger = get_logger(__name__)

class GovernanceService(BaseAnalyticsService):
    def __init__(self, log_dir: str = "logs"):
        super().__init__("audit.jsonl")

    async def get_governance_metrics(self, time_range: str = "30d", start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Aggregate governance metrics with dynamic boundaries."""
        if not os.path.exists(self.log_path):
            return self._empty_metrics()

        start_filter, end_filter, days_limit = self._get_date_bounds(time_range, start_date, end_date)
        now = datetime.utcnow()
        baseline_24h_filter = now - timedelta(days=1)

        activity_counter = Counter()
        user_activity = Counter()
        status_counter = Counter()
        hourly_activity = Counter()
        error_distribution = Counter()
        recent_events = []
        
        daily_engagement = set()
        baseline_24h = Counter()

        try:
            with open(self.log_path, "r") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        ts_str = entry.get("timestamp")
                        if not ts_str: continue
                        
                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).replace(tzinfo=None)
                        if ts < start_filter or ts > end_filter: continue

                        self._process_entry(
                            entry, activity_counter, user_activity, status_counter, 
                            hourly_activity, error_distribution, recent_events
                        )
                        daily_engagement.add(ts_str[:10])

                        if ts >= baseline_24h_filter:
                            event_type = entry.get("event_type", "unknown")
                            baseline_24h[event_type] += 1

                    except (json.JSONDecodeError, ValueError):
                        continue
        except Exception as e:
            logger.error(f"Error reading governance logs: {e}")
            return self._empty_metrics()

        return self._finalize_metrics(
            activity_counter, user_activity, status_counter, hourly_activity, 
            error_distribution, recent_events, baseline_24h, daily_engagement, days_limit
        )

    def _process_entry(self, entry, act, usr, stat, hourly, err, recent):
        event_type = entry.get("event_type", "unknown")
        status = entry.get("status", "success")
        user_id = entry.get("user_id", "system")
        ts_str = entry.get("timestamp")
        
        act[event_type] += 1
        usr[user_id] += 1
        stat[status] += 1
        
        if ts_str:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                hourly[dt.hour] += 1
            except: pass

        if status in ["failure", "error"]:
            err[event_type] += 1

        recent.append({
            "id": entry.get("audit_id", "N/A"),
            "timestamp": ts_str,
            "event": event_type.replace("_", " ").title(),
            "action": entry.get("action", ""),
            "resource": entry.get("resource_id", "N/A"),
            "status": status,
            "user": user_id
        })

    def _finalize_metrics(self, act, usr, stat, hourly, err, recent, b24, daily_engagement, limit):
        is_extrapolated = self._is_extrapolated(daily_engagement, limit)
        
        if is_extrapolated:
            final_activity = [ {"name": k.replace("_", " ").title(), "value": v * limit} for k, v in b24.items() ]
        else:
            final_activity = [ {"name": k.replace("_", " ").title(), "value": v} for k, v in act.items() ]

        recent.reverse()
        return {
            "activity_distribution": final_activity,
            "user_activity": [{"user": k, "count": v * (limit if is_extrapolated else 1)} for k, v in usr.items()],
            "compliance_health": {
                "success": (stat.get("success", 0) * (limit if is_extrapolated else 1)),
                "failure": (stat.get("failure", 0) + stat.get("error", 0)) * (limit if is_extrapolated else 1),
            },
            "hourly_trend": [ {"hour": f"{h:02d}:00", "count": hourly.get(h, 0)} for h in range(24) ],
            "error_analysis": [ {"op": k.replace("_", " ").title(), "errors": v * (limit if is_extrapolated else 1)} for k, v in err.items() ],
            "recent_trail": recent[:50],
            "is_extrapolated": is_extrapolated
        }

    def _empty_metrics(self) -> Dict[str, Any]:
        return {
            "activity_distribution": [], "user_activity": [],
            "compliance_health": {"success": 0, "failure": 0},
            "hourly_trend": [], "error_analysis": [], "recent_trail": [],
            "is_extrapolated": False
        }
