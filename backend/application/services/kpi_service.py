import json
import os
from datetime import datetime
from typing import Dict, List, Any
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

class KPIService:
    def __init__(self, log_path: str = None):
        if log_path:
            self.log_path = log_path
        else:
            # Default to project root 'logs' folder
            current_file = os.path.abspath(__file__)
            # 3 levels up: services -> application -> backend -> root
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))
            self.log_path = os.path.join(root_dir, "logs", "unified_agent_audit.jsonl")

    async def get_executive_summary(self) -> Dict[str, Any]:
        """
        Parses the JSONL log stream and aggregates high-level KPIs.
        """
        if not os.path.exists(self.log_path):
            logger.warning(f"Log file not found at {self.log_path}")
            return self._empty_kpi_state()

        stats = {
            "total_tasks": 0,
            "hallucinations": 0,
            "total_latency": 0.0,
            "latency_count": 0,
            "agent_performance": {}, # By agent_name: {success, errors, total_latency}
            "mtat": 0.0, # Mean Turnaround Time
            "unique_documents": set(),
        }

        # Traces map to calculate duration per correlation_id
        traces: Dict[str, List[datetime]] = {}

        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        self._process_entry(entry, stats, traces)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error(f"Error parsing logs for KPIs: {e}")
            return self._empty_kpi_state()

        return self._finalize_stats(stats, traces)

    def _process_entry(self, entry: Dict[str, Any], stats: Dict[str, Any], traces: Dict[str, Any]):
        # 1. Hallucination Detection
        if entry.get("hallucination_detected") is True:
            stats["hallucinations"] += 1

        # 2. Agent Performance
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
            if latency is not None:
                stats["agent_performance"][agent]["total_latency"] += float(latency)

        # 3. Correlation Tracking for MTTA/MTAT
        cid = entry.get("correlation_id")
        
        # 4. Document Integrity Tracking (Only count actual uploads, not system polls)
        payload = entry.get("payload", {})
        if payload.get("action") == "upload_completed":
            doc_id = entry.get("contract_id") or entry.get("resource_id")
            if doc_id:
                stats["unique_documents"].add(doc_id)

        if cid:
            ts_str = entry.get("timestamp")
            if ts_str:
                # Remove 'Z' if present, replace with offset-aware if needed
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if cid not in traces:
                    traces[cid] = []
                traces[cid].append(ts)

    def _finalize_stats(self, stats: Dict[str, Any], traces: Dict[str, Any]) -> Dict[str, Any]:
        # Calculate full turnaround times per correlation_id
        task_durations = []
        for cid, times in traces.items():
            if len(times) > 1:
                duration = (max(times) - min(times)).total_seconds()
                task_durations.append(duration)
        
        stats["total_tasks"] = len(stats["unique_documents"]) or len(traces)
        if task_durations:
            stats["mtat"] = sum(task_durations) / len(task_durations)
        
        # Calculate average hallucination rate
        hallucination_rate = 0.0
        if stats["total_tasks"] > 0:
            hallucination_rate = (stats["hallucinations"] / stats["total_tasks"]) * 100

        # Format for frontend
        return {
            "summary": {
                "hallucination_rate": f"{hallucination_rate:.1f}%",
                "total_hallucinations": stats["hallucinations"],
                "avg_latency_seconds": f"{stats['mtat']:.1f}s",
                "total_processed": stats["total_tasks"],
                "system_health": "Optimal" if hallucination_rate < 5 else "Warning"
            },
            "agent_breakdown": [
                {
                    "name": name,
                    "success_rate": f"{(data['success']/data['count']*100):.1f}%" if data['count'] > 0 else "0%",
                    "avg_node_latency": f"{(data['total_latency']/data['count']):.0f}ms" if data['count'] > 0 else "0ms",
                    "total_calls": data["count"]
                }
                for name, data in stats["agent_performance"].items()
            ]
        }

    def _empty_kpi_state(self) -> Dict[str, Any]:
        return {
            "summary": {
                "hallucination_rate": "0%",
                "total_hallucinations": 0,
                "avg_latency_seconds": "0s",
                "total_processed": 0,
                "system_health": "Unknown"
            },
            "agent_breakdown": []
        }
