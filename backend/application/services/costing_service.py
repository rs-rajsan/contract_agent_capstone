import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from backend.shared.utils.logger import get_logger
from backend.shared.config.phase3_config import AppConfig
from backend.application.services.base_analytics_service import BaseAnalyticsService

logger = get_logger(__name__)

class CostingService(BaseAnalyticsService):
    # Pricing sourced from central AppConfig
    PRICING = AppConfig.AI_PRICING

    def __init__(self, log_path: str = None):
        super().__init__("unified_agent_audit.jsonl")
        if log_path:
            self.log_path = log_path

    async def get_costing_metrics(self, time_range: str = "30d", start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """
        Parses logs and aggregates financial metrics with dynamic boundaries.
        """
        if not os.path.exists(self.log_path):
            return self._empty_costing_state()

        start_filter, end_filter, days_limit = self._get_date_bounds(time_range, start_date, end_date)
        now = datetime.utcnow()
        baseline_24h_filter = now - timedelta(days=1)

        data = {
            "total_spend": 0.0,
            "total_input_tokens": 0,
            "total_output_tokens": 0,
            "processed_contracts": 0,
            "total_latency": 0.0,
            "latency_count": 0,
            "min_latency": float('inf'),
            "max_latency": 0.0,
            "agent_costs": {},
            "model_costs": {},
            "daily_trend": {},
            "budget": AppConfig.AI_BUDGET_MONTHLY, 
            "baseline_24h": {
                "spend": 0.0, "input_tokens": 0, "output_tokens": 0, 
                "processed_contracts": 0, "total_latency": 0.0, "latency_count": 0
            }
        }

        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        ts_str = entry.get("timestamp")
                        if not ts_str: continue
                        
                        ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).replace(tzinfo=None)
                        if ts < start_filter or ts > end_filter: continue

                        cost = self._process_cost_entry(entry, data)
                        
                        if ts >= baseline_24h_filter:
                            self._process_baseline(entry, data, cost)

                    except (json.JSONDecodeError, ValueError):
                        continue
        except Exception as e:
            logger.error(f"Error parsing costing logs: {e}")
            return self._empty_costing_state()

        return self._finalize_costing(data, days_limit)

    def _process_baseline(self, entry: Dict[str, Any], data: Dict[str, Any], cost: float):
        payload = entry.get("payload", {})
        agent = entry.get("agent_name") or entry.get("agent")
        data["baseline_24h"]["spend"] += cost
        data["baseline_24h"]["input_tokens"] += (entry.get("input_tokens") or payload.get("input_tokens") or payload.get("tokens") or 0)
        data["baseline_24h"]["output_tokens"] += (entry.get("output_tokens") or payload.get("output_tokens") or 0)
        
        latency = entry.get("latency_ms")
        if latency:
            data["baseline_24h"]["total_latency"] += float(latency)
            data["baseline_24h"]["latency_count"] += 1

        if entry.get("status") == "success" and agent == "Output Agent":
            data["baseline_24h"]["processed_contracts"] += 1

    def _process_cost_entry(self, entry: Dict[str, Any], data: Dict[str, Any]) -> float:
        payload = entry.get("payload", {})
        input_tokens = entry.get("input_tokens") or payload.get("input_tokens") or payload.get("tokens") or 0
        output_tokens = entry.get("output_tokens") or payload.get("output_tokens") or 0
        model = entry.get("model_name") or payload.get("model_name") or "unknown"
        agent = entry.get("agent_name") or entry.get("agent") or "unknown"
        ts_date = entry.get("timestamp", "")[:10]

        if not isinstance(input_tokens, (int, float)): input_tokens = 0
        if not isinstance(output_tokens, (int, float)): output_tokens = 0

        price = self.PRICING.get(model, self.PRICING["unknown"])
        cost = (input_tokens / 1_000_000) * price["input"] + (output_tokens / 1_000_000) * price["output"]

        data["total_spend"] += cost
        data["total_input_tokens"] += input_tokens
        data["total_output_tokens"] += output_tokens
        
        latency = entry.get("latency_ms")
        if latency:
            val = float(latency)
            data["total_latency"] += val
            data["latency_count"] += 1
            data["min_latency"] = min(data["min_latency"], val)
            data["max_latency"] = max(data["max_latency"], val)

        if entry.get("status") == "success" and agent == "Output Agent":
            data["processed_contracts"] += 1

        data["model_costs"][model] = data["model_costs"].get(model, 0.0) + cost
        data["agent_costs"][agent] = data["agent_costs"].get(agent, 0.0) + cost
        if ts_date:
            data["daily_trend"][ts_date] = data["daily_trend"].get(ts_date, 0.0) + cost
            
        return cost

    def _finalize_costing(self, data: Dict[str, Any], days_limit: int) -> Dict[str, Any]:
        daily_engagement = set(data["daily_trend"].keys())
        is_extrapolated = self._is_extrapolated(daily_engagement, days_limit)
        
        if is_extrapolated:
            total_spend = data["baseline_24h"]["spend"] * days_limit
            total_input = data["baseline_24h"]["input_tokens"] * days_limit
            total_output = data["baseline_24h"]["output_tokens"] * days_limit
            total_processed = data["baseline_24h"]["processed_contracts"] * days_limit
            avg_latency = data["baseline_24h"]["total_latency"] / max(data["baseline_24h"]["latency_count"], 1)
        else:
            total_spend = data["total_spend"]
            total_input = data["total_input_tokens"]
            total_output = data["total_output_tokens"]
            total_processed = data["processed_contracts"]
            avg_latency = data["total_latency"] / max(data["latency_count"], 1)

        avg_daily = (data["baseline_24h"]["spend"]) if is_extrapolated else (total_spend / max(len(daily_engagement), 1))
        forecast_30d = avg_daily * 30
        budget_utilization = (total_spend / data["budget"]) * 100 if data["budget"] > 0 else 0
        cost_per_contract = total_spend / max(total_processed, 1)

        sorted_trend = [{"date": d, "cost": round(c, 4)} for d, c in sorted(data["daily_trend"].items())]
        model_breakdown = [{"name": m, "cost": round(c, 4), "percentage": round((c/max(data['total_spend'], 0.001)*100), 1)} for m, c in data["model_costs"].items()]
        agent_breakdown = [{"name": a, "cost": round(c, 4)} for a, c in sorted(data["agent_costs"].items(), key=lambda x: x[1], reverse=True)]

        return {
            "summary": {
                "total_spend": round(total_spend, 2),
                "cost_per_contract": round(cost_per_contract, 3),
                "total_tokens": total_input + total_output,
                "avg_latency_ms": round(avg_latency, 1),
                "min_latency_ms": round(data["min_latency"], 1) if data["latency_count"] > 0 else 0,
                "max_latency_ms": round(data["max_latency"], 1),
                "projected_30d_cost": round(forecast_30d, 2),
                "budget_limit": data["budget"],
                "budget_utilization": round(budget_utilization, 1),
                "is_extrapolated": is_extrapolated
            },
            "trends": sorted_trend,
            "models": model_breakdown,
            "agents": agent_breakdown,
            "efficiency": {
                "input_tokens": total_input,
                "output_tokens": total_output,
                "ratio": round(total_output / max(total_input, 1), 2)
            }
        }

    def _empty_costing_state(self) -> Dict[str, Any]:
        return {
            "summary": {
                "total_spend": 0, "cost_per_contract": 0, "total_tokens": 0,
                "projected_30d_cost": 0, "budget_limit": 1200, "budget_utilization": 0,
                "is_extrapolated": False
            },
            "trends": [], "models": [], "agents": [], 
            "efficiency": {"input_tokens": 0, "output_tokens": 0, "ratio": 0}
        }
