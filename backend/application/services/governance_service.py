import json
import os
from collections import Counter
from datetime import datetime
from typing import Dict, Any, List

class GovernanceService:
    def __init__(self, log_dir: str = "logs"):
        self.log_path = os.path.join(os.getcwd(), log_dir, "audit.jsonl")

    async def get_governance_metrics(self) -> Dict[str, Any]:
        """Aggregate governance and activity metrics from audit.jsonl"""
        if not os.path.exists(self.log_path):
            return self._empty_metrics()

        activity_counter = Counter()
        user_activity = Counter()
        status_counter = Counter()
        hourly_activity = Counter()
        error_distribution = Counter()
        recent_events = []

        try:
            with open(self.log_path, "r") as f:
                lines = f.readlines()
                # Process last 1000 lines for performance
                for line in lines[-1000:]:
                    try:
                        entry = json.loads(line)
                        self._process_entry(
                            entry, 
                            activity_counter, 
                            user_activity, 
                            status_counter, 
                            hourly_activity,
                            error_distribution,
                            recent_events
                        )
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            print(f"Error reading governance logs: {e}")
            return self._empty_metrics()

        # Finalize and sort recent events (most recent first)
        recent_events.reverse()

        return {
            "activity_distribution": [
                {"name": k.replace("_", " ").title(), "value": v} 
                for k, v in activity_counter.items()
            ],
            "user_activity": [
                {"user": k, "count": v} 
                for k, v in user_activity.items()
            ],
            "compliance_health": {
                "success": status_counter.get("success", 0),
                "failure": status_counter.get("failure", 0) + status_counter.get("error", 0),
            },
            "hourly_trend": [
                {"hour": f"{h:02d}:00", "count": hourly_activity.get(h, 0)} 
                for h in range(24)
            ],
            "error_analysis": [
                {"op": k.replace("_", " ").title(), "errors": v} 
                for k, v in error_distribution.items()
            ],
            "recent_trail": recent_events[:50]
        }

    def _process_entry(
        self, 
        entry: Dict[str, Any], 
        activity_counter: Counter,
        user_activity: Counter,
        status_counter: Counter,
        hourly_activity: Counter,
        error_distribution: Counter,
        recent_events: List[Dict[str, Any]]
    ):
        event_type = entry.get("event_type", "unknown")
        status = entry.get("status", "success")
        user_id = entry.get("user_id", "system")
        ts_str = entry.get("timestamp")
        
        # 1. Activity Distribution
        activity_counter[event_type] += 1
        
        # 2. User Engagement
        user_activity[user_id] += 1
        
        # 3. Status Counter
        status_counter[status] += 1
        
        # 4. Hourly Trend
        if ts_str:
            try:
                # audit.jsonl uses isoformat() which might not have 'Z' or might have it
                ts_str = ts_str.replace("Z", "+00:00")
                dt = datetime.fromisoformat(ts_str)
                hourly_activity[dt.hour] += 1
            except ValueError:
                pass

        # 5. Error Distribution
        if status in ["failure", "error"]:
            error_distribution[event_type] += 1

        # 6. Audit Trail
        recent_events.append({
            "id": entry.get("audit_id", "N/A"),
            "timestamp": ts_str,
            "event": event_type.replace("_", " ").title(),
            "action": entry.get("action", ""),
            "resource": entry.get("resource_id", "N/A"),
            "status": status,
            "user": user_id
        })

    def _empty_metrics(self) -> Dict[str, Any]:
        return {
            "activity_distribution": [],
            "user_activity": [],
            "compliance_health": {"success": 0, "failure": 0},
            "hourly_trend": [],
            "error_analysis": [],
            "recent_trail": []
        }
