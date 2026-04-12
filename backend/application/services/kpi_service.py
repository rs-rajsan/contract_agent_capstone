import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from backend.shared.utils.logger import get_logger
from backend.application.services.base_analytics_service import BaseAnalyticsService

logger = get_logger(__name__)

class KPIService(BaseAnalyticsService):
    def __init__(self, log_path: str = None):
        super().__init__("unified_agent_audit.jsonl")
        if log_path:
            self.log_path = log_path

    async def get_executive_summary(self, time_range: str = "30d", start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """
        Parses logs and aggregates KPIs with dynamic boundaries.
        """
        if not os.path.exists(self.log_path):
            return self._empty_kpi_state()

        start_filter, end_filter, days_limit = self._get_date_bounds(time_range, start_date, end_date)
        now = datetime.utcnow()
        baseline_24h_filter = now - timedelta(days=1)

        stats = {
            "hallucinations": 0, "latency_count": 0, "agent_performance": {},
            "unique_documents": set(), "daily_engagement": set(),
            "baseline_24h": {"hallucinations": 0, "processed": 0}
        }
        traces: Dict[str, List[datetime]] = {}

        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        ts_str = entry.get("timestamp")
                        if not ts_str: continue
                        
                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).replace(tzinfo=None)
                        if ts < start_filter or ts > end_filter: continue

                        self._process_entry(entry, stats, traces)
                        stats["daily_engagement"].add(ts_str[:10])

                        if ts >= baseline_24h_filter:
                            self._process_baseline(entry, stats)

                    except (json.JSONDecodeError, ValueError):
                        continue
        except Exception as e:
            logger.error(f"Error parsing KPIs: {e}")
            return self._empty_kpi_state()

        return self._finalize_stats(stats, traces, days_limit)

    def _process_baseline(self, entry: Dict[str, Any], stats: Dict[str, Any]):
        if entry.get("hallucination_detected") is True:
            stats["baseline_24h"]["hallucinations"] += 1
        
        cid = entry.get("correlation_id")
        if cid:
            if "processed_cids" not in stats["baseline_24h"]:
                stats["baseline_24h"]["processed_cids"] = set()
            stats["baseline_24h"]["processed_cids"].add(cid)

    def _process_entry(self, entry: Dict[str, Any], stats: Dict[str, Any], traces: Dict[str, Any]):
        if entry.get("hallucination_detected") is True:
            stats["hallucinations"] += 1

        agent = entry.get("agent_name")
        if agent:
            if agent not in stats["agent_performance"]:
                stats["agent_performance"][agent] = {"success": 0, "error": 0, "total_latency": 0.0, "count": 0}
            stats["agent_performance"][agent]["count"] += 1
            if entry.get("status") == "success":
                stats["agent_performance"][agent]["success"] += 1
            elif entry.get("status") == "error":
                stats["agent_performance"][agent]["error"] += 1
            latency = entry.get("latency_ms")
            if latency: stats["agent_performance"][agent]["total_latency"] += float(latency)

        cid = entry.get("correlation_id")
        payload = entry.get("payload", {})
        if payload.get("action") == "upload_completed":
            doc_id = entry.get("contract_id") or entry.get("resource_id")
            if doc_id: stats["unique_documents"].add(doc_id)
        if cid:
            ts_str = entry.get("timestamp")
            if ts_str:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).replace(tzinfo=None)
                if cid not in traces: traces[cid] = []
                traces[cid].append(ts)

    def _finalize_stats(self, stats: Dict[str, Any], traces: Dict[str, Any], days_limit: int) -> Dict[str, Any]:
        is_extrapolated = self._is_extrapolated(stats["daily_engagement"], days_limit)
        
        task_durations = [ (max(times) - min(times)).total_seconds() for times in traces.values() if len(times) > 1 ]
        mtat = sum(task_durations) / len(task_durations) if task_durations else 0.0
        
        baseline_processed = len(stats["baseline_24h"].get("processed_cids", []))
        if is_extrapolated:
            total_processed = baseline_processed * days_limit
            total_hallucinations = stats["baseline_24h"]["hallucinations"] * days_limit
        else:
            total_processed = len(stats["unique_documents"]) or len(traces)
            total_hallucinations = stats["hallucinations"]

        hallucination_rate = (total_hallucinations / max(total_processed, 1)) * 100
        
        return {
            "summary": {
                "hallucination_rate": f"{hallucination_rate:.1f}%",
                "total_hallucinations": total_hallucinations,
                "avg_latency_seconds": f"{mtat:.1f}s",
                "total_processed": total_processed,
                "system_health": "Optimal" if hallucination_rate < 5 else "Warning",
                "is_extrapolated": is_extrapolated
            },
            "agent_breakdown": [
                {
                    "name": name,
                    "success_rate": f"{(data['success']/data['count']*100):.1f}%" if data['count'] > 0 else "0%",
                    "avg_node_latency": f"{(data['total_latency']/data['count']):.0f}ms" if data['count'] > 0 else "0ms",
                    "total_calls": data["count"] * (days_limit if is_extrapolated else 1)
                }
                for name, data in stats["agent_performance"].items()
            ]
        }

    def _empty_kpi_state(self) -> Dict[str, Any]:
        return {
            "summary": {
                "hallucination_rate": "0%", "total_hallucinations": 0,
                "avg_latency_seconds": "0s", "total_processed": 0, "system_health": "Unknown",
                "is_extrapolated": False
            },
            "agent_breakdown": []
        }
