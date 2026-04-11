from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.shared.utils.graph_utils import get_graph
from backend.shared.utils.logger import get_logger

logger = get_logger(__name__)

class StrategicService:
    def __init__(self):
        self._graph = None

    @property
    def graph(self):
        if self._graph is None:
            self._graph = get_graph()
        return self._graph

    async def get_filtered_strategic_data(
        self, 
        status: str = "All", 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None, 
        contract_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Retrieve aggregated strategic metrics from Neo4j based on filters"""
        try:
            # Base WHERE clauses
            where_clauses = ["c.tenant_id = 'demo_tenant_1'"]
            params = {}

            if status != "All":
                where_clauses.append("c.intelligence_status = $status")
                params["status"] = status.lower()

            if start_date:
                # Ensure ISO format for Neo4j date/datetime
                where_clauses.append("c.upload_date >= datetime($start_date)")
                params["start_date"] = start_date

            if end_date:
                where_clauses.append("c.upload_date <= datetime($end_date)")
                params["end_date"] = end_date

            if contract_ids and len(contract_ids) > 0:
                where_clauses.append("c.file_id IN $contract_ids")
                params["contract_ids"] = contract_ids

            where_str = " AND ".join(where_clauses)

            # 1. Risk Profile Aggregation
            risk_query = f"""
            MATCH (c:Contract)
            WHERE {where_str}
            RETURN c.risk_level as risk_level, count(c) as count
            """
            
            risk_results = self.graph.query(risk_query, params)
            risk_distribution = {r["risk_level"].capitalize() if r["risk_level"] else "Unknown": r["count"] for r in risk_results}

            # 2. Jurisdictional Exposure
            jurisdiction_query = f"""
            MATCH (c:Contract)-[:HAS_GOVERNING_LAW]->(country:Country)
            WHERE {where_str}
            RETURN country.name as country, count(c) as count
            ORDER BY count DESC
            LIMIT 10
            """
            jurisdiction_results = self.graph.query(jurisdiction_query, params)
            top_jurisdictions = [{"name": j["country"], "value": j["count"]} for j in jurisdiction_results]

            # 3. Efficiency ROI - Estimated savings (2 hours per contract)
            contracts_count_query = f"MATCH (c:Contract) WHERE {where_str} RETURN count(c) as total"
            total_contracts = self.graph.query(contracts_count_query, params)[0]["total"]
            hours_saved = total_contracts * 2

            # 4. Total Value at Stake
            value_query = f"""
            MATCH (c:Contract)
            WHERE {where_str}
            RETURN sum(c.total_amount) as total_value
            """
            total_value = self.graph.query(value_query, params)[0]["total_value"] or 0

            return {
                "risk_distribution": risk_distribution,
                "top_jurisdictions": top_jurisdictions,
                "efficiency": {
                    "total_contracts": total_contracts,
                    "hours_saved": hours_saved,
                    "velocity_score": "High" if total_contracts > 10 else ("Medium" if total_contracts > 0 else "N/A")
                },
                "strategic_value": {
                    "total_value_at_stake": total_value,
                    "currency": "USD"
                }
            }

        except Exception as e:
            logger.error(f"Failed to aggregate strategic insights: {e}")
            raise e
