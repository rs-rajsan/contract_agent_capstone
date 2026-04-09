import asyncio
import sys
import os
import json
from datetime import datetime

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.application.services.system_health_manager import SystemHealthManager

async def run_diagnostic():
    print("Outage Simulation - Running Health Check...")
    
    # Initialize health manager
    # We let it load the real Neo4j and LLM configs from .env
    manager = SystemHealthManager()
    
    try:
        results = await manager.run_full_diagnostic()
        print("\n--- Diagnostic Results ---")
        for res in results:
            statusMark = "OK" if res["status_code"] == 200 else "FAIL"
            print(f"[{statusMark}] {res['agent_name']} ({res['component']}) - Code: {res['status_code']}")
            if res["status_code"] != 200:
                print(f"      Error: {res['system_error']}")
                print(f"      User Msg: {res['user_facing_message']}")
        
        # Log to file to verify logging logic (simulating the API behavior)
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "app_load_test.jsonl")
        
        with open(log_file, "a", encoding="utf-8") as f:
            for res in results:
                f.write(json.dumps(res) + "\n")
        print(f"\nResults appended to {log_file}")
                
    except Exception as e:
        print(f"Fatal error during simulation: {e}")

if __name__ == "__main__":
    asyncio.run(run_diagnostic())
