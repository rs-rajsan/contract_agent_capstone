from typing import Any, List, Optional, Type

from dotenv import load_dotenv
from langchain_core.tools import BaseTool
from backend.shared.utils.gemini_embedding_service import embedding
from langchain_neo4j import Neo4jGraph
from backend.shared.utils.graph_utils import get_graph
from pydantic import BaseModel, Field
from enum import Enum

load_dotenv()


from .utils import convert_neo4j_date

CONTRACT_TYPES = [
    "Affiliate Agreement",
    "Development",
    "Distributor", 
    "Endorsement",
    "Franchise",
    "Hosting",
    "IP",
    "Joint Venture",
    "License Agreement",
    "Maintenance",
    "Manufacturing",
    "Marketing",
    "Non Compete/Solicit",
    "Outsourcing",
    "Promotion",
    "Reseller",
    "Service",
    "Sponsorship",
    "Strategic Alliance",
    "Supply",
    "Transportation",
    # New contract types
    "MSA",
    "Master Services Agreement",
    "SOW", 
    "Statement of Work",
    "NDA",
    "MNDA",
    "Non-Disclosure Agreement",
    "DPA",
    "Data Processing Agreement",
    "SaaS Agreement",
    "Subscription Agreement",
    "IP Addendum",
    "Licensing Addendum",
]

# embedding imported from gemini_embedding_service (1536 dimensions)


class NumberOperator(str, Enum):
    EQUALS = "="
    GREATER_THAN = ">"
    LESS_THAN = "<"


class MonetaryValue(BaseModel):
    """The total amount or value of a contract"""

    value: float
    operator: NumberOperator

class Location(BaseModel):
    """Specified location"""

    country: Optional[str] = Field(None, description="Use two-letter ISO standard")
    state: Optional[str]


def get_contracts(
    embeddings: Any,
    min_effective_date: Optional[str] = None,
    max_effective_date: Optional[str] = None,
    min_end_date: Optional[str] = None,
    max_end_date: Optional[str] = None,
    contract_type: Optional[str] = None,
    parties: Optional[List[str]] = None,
    summary_search: Optional[str] = None,
    active: Optional[bool] = None,
    cypher_aggregation: Optional[str] = None,
    monetary_value: Optional[MonetaryValue] = None,
    governing_law: Optional[Location] = None
):  
    params: dict[str, Any] = {}
    filters: list[str] = []
    cypher_statement = "MATCH (c:Contract) "

    if governing_law:
        if governing_law.country:
            filters.append(
            """EXISTS {
                MATCH (c)-[:HAS_GOVERNING_LAW]->(country)
                WHERE toLower(country.country) = $governing_law_country
            }"""
            )
            params["governing_law_country"] = governing_law.country.lower()

    # Total amount
    if monetary_value:
        filters.append(f"c.total_amount {monetary_value.operator.value} $total_value")
        params["total_value"] = monetary_value.value

    # Effective date range
    if min_effective_date:
        filters.append("c.effective_date >= date($min_effective_date)")
        params["min_effective_date"] = min_effective_date
    if max_effective_date:
        filters.append("c.effective_date <= date($max_effective_date)")
        params["max_effective_date"] = max_effective_date

    # End date range
    if min_end_date:
        filters.append("c.end_date >= date($min_end_date)")
        params["min_end_date"] = min_end_date
    if max_end_date:
        filters.append("c.end_date <= date($max_end_date)")
        params["max_end_date"] = max_end_date

    # Contract type - HYBRID APPROACH: Exact + Semantic
    if contract_type:
        # First try exact matching with abbreviation mapping
        type_mappings = {
            "MSA": ["MSA", "Master Services Agreement"],
            "SOW": ["SOW", "Statement of Work"], 
            "NDA": ["NDA", "MNDA", "Non-Disclosure Agreement"],
            "DPA": ["DPA", "Data Processing Agreement"],
            "Master Services Agreement": ["MSA", "Master Services Agreement"],
            "Statement of Work": ["SOW", "Statement of Work"],
            "Non-Disclosure Agreement": ["NDA", "MNDA", "Non-Disclosure Agreement"]
        }
        
        possible_types = type_mappings.get(contract_type, [contract_type])
        
        if len(possible_types) > 1:
            type_conditions = []
            for i, ptype in enumerate(possible_types):
                param_name = f"contract_type_{i}"
                type_conditions.append(f"c.contract_type = ${param_name}")
                params[param_name] = ptype
            filters.append(f"({' OR '.join(type_conditions)})")
        else:
            # If no exact mapping, use semantic search on summary
            search_terms = [
                f"{contract_type} contract",
                f"{contract_type} agreement", 
                contract_type
            ]
            
            # Create comprehensive search query
            semantic_query = " ".join(search_terms)
            params["type_embedding"] = embeddings.embed_query(semantic_query)
            
            # Use semantic search as fallback
            cypher_statement += """
            WITH c, vector.similarity.cosine(c.embedding, $type_embedding) AS type_score
            WHERE type_score > 0.75
            """

    # Parties (relationship-based filter)
    if parties:
        parties_filter = []
        for i, party in enumerate(parties):
            party_param_name = f"party_{i}"
            parties_filter.append(
                f"""EXISTS {{
                MATCH (c)<-[:PARTY_TO]-(party)
                WHERE toLower(party.name) CONTAINS ${party_param_name}
            }}"""
            )
            params[party_param_name] = party.lower()

        if parties_filter:
            filters.append(" AND ".join(parties_filter))
    
    if active is not None:
        operator = ">=" if active else "<"
        filters.append(f"c.end_date {operator} date()")
    
    # Apply remaining filters
    if filters:
        if contract_type and contract_type not in type_mappings and len(type_mappings.get(contract_type, [contract_type])) == 1:
            # Semantic search case
            cypher_statement += f"AND {' AND '.join(filters)} "
        else:
            cypher_statement += f"WHERE {' AND '.join(filters)} "
    
    # Summary search
    if summary_search:
        summary_embedding = embeddings.embed_query(summary_search)
        params["summary_embedding"] = summary_embedding
        
        if contract_type and contract_type not in type_mappings:
            # Combine type and summary semantic search
            cypher_statement += """
            WITH c, type_score, vector.similarity.cosine(c.embedding, $summary_embedding) AS summary_score
            WITH c, (type_score + summary_score) / 2 AS combined_score
            WHERE combined_score > 0.8
            ORDER BY combined_score DESC
            """
        else:
            # Just summary search
            cypher_statement += """
            WITH c, vector.similarity.cosine(c.embedding, $summary_embedding) AS summary_score
            WHERE summary_score > 0.9
            ORDER BY summary_score DESC
            """
    elif contract_type and contract_type not in type_mappings:
        # Just semantic type search
        cypher_statement += "ORDER BY type_score DESC "
    else:
        # No semantic search, sort by date
        cypher_statement += "WITH c ORDER BY c.effective_date DESC "

    if cypher_aggregation:
        cypher_statement += """WITH c, c.summary AS summary, c.contract_type AS contract_type,
          c.contract_scope AS contract_scope, c.effective_date AS effective_date, c.end_date AS end_date,
          [(c)<-[r:PARTY_TO]-(party) | {name: party.name, role: r.role}] AS parties, c.end_date >= date() AS active, c.total_amount as monetary_value, c.file_id AS contract_id,
          apoc.coll.toSet([(c)<-[:PARTY_TO]-(party)-[:LOCATED_IN]->(country) | country.name]) AS countries """
        cypher_statement += cypher_aggregation
    else:
        # Final RETURN
        cypher_statement += """WITH collect(c) AS nodes
        RETURN {
            total_count_of_contracts: size(nodes),
            example_values: [
              el in nodes[..5] |
              {summary:el.summary, contract_type:el.contract_type, contract_scope: el.contract_scope,
               file_id: el.file_id, effective_date: el.effective_date, end_date: el.end_date,monetary_value: el.total_amount,
               contract_id: el.file_id, parties: [(el)<-[r:PARTY_TO]-(party) | {name: party.name, role: r.role}],
               countries: apoc.coll.toSet([(el)<-[:PARTY_TO]-()-[:LOCATED_IN]->(country) | country.name])}
            ]
        } AS output"""
    
    graph = get_graph()
    output = graph.query(cypher_statement, params)
    return [convert_neo4j_date(el) for el in output]


class ContractInput(BaseModel):
    min_effective_date: Optional[str] = Field(
        None, description="Earliest contract effective date (YYYY-MM-DD)"
    )
    max_effective_date: Optional[str] = Field(
        None, description="Latest contract effective date (YYYY-MM-DD)"
    )
    min_end_date: Optional[str] = Field(
        None, description="Earliest contract end date (YYYY-MM-DD)"
    )
    max_end_date: Optional[str] = Field(
        None, description="Latest contract end date (YYYY-MM-DD)"
    )
    contract_type: Optional[str] = Field(
        None, description="Contract type - supports both exact matching (MSA, SOW, NDA) and semantic search for other types"
    )
    parties: Optional[List[str]] = Field(
        None, description="List of parties involved in the contract"
    )
    summary_search: Optional[str] = Field(
        None, description="Semantic search of contract content and summary"
    )
    active: Optional[bool] = Field(None, description="Whether the contract is active")
    governing_law: Optional[Location] = Field(None, description="Governing law of the contract")
    monetary_value: Optional[MonetaryValue] = Field(
        None, description="The total amount or value of a contract"
    )
    cypher_aggregation: Optional[str] = Field(
        None,
        description="""Custom Cypher statement for advanced aggregations and analytics.""",
    )


class ContractSearchTool(BaseTool):
    name: str = "ContractSearch"
    description: str = (
        "useful for when you need to answer questions related to any contracts. Uses hybrid search: exact matching for common types (MSA, SOW, NDA) and semantic search for others."
    )
    args_schema: Type[BaseModel] = ContractInput

    def _run(
        self,
        min_effective_date: Optional[str] = None,
        max_effective_date: Optional[str] = None,
        min_end_date: Optional[str] = None,
        max_end_date: Optional[str] = None,
        contract_type: Optional[str] = None,
        parties: Optional[List[str]] = None,
        summary_search: Optional[str] = None,
        active: Optional[bool] = None,
        monetary_value: Optional[MonetaryValue] = None,
        cypher_aggregation: Optional[str] = None,
        governing_law: Optional[Location] = None
    ) -> str:
        """Use the tool."""
        return get_contracts(
            embedding,
            min_effective_date,
            max_effective_date,
            min_end_date,
            max_end_date,
            contract_type,
            parties,
            summary_search,
            active,
            cypher_aggregation,
            monetary_value,
            governing_law
        )