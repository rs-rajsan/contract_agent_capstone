import requests
import json
import os
import time

API_URL = "http://localhost:8000/api/monitoring/system/health"
LOG_FILE = "logs/app_load_test.jsonl"

def verify_diagnostics():
    print("Calling diagnostic endpoint...")
    try:
        response = requests.get(API_URL)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Result Status: {data.get('status')}")
        
        for res in data.get('results', []):
            print(f"  - {res['agent_name']}: {res['status_code']} ({res['user_facing_message']})")

        print("\nChecking log file...")
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, "r") as f:
                lines = f.readlines()
                last_few = lines[-len(data.get('results', [])):]
                print(f"Last {len(last_few)} lines in {LOG_FILE}:")
                for line in last_few:
                    parsed = json.loads(line)
                    print(f"    - [{parsed['timestamp']}] {parsed['agent_name']}: {parsed['status_code']}")
        else:
            print(f"Log file {LOG_FILE} NOT found!")

    except Exception as e:
        print(f"Error during verification: {e}")

if __name__ == "__main__":
    verify_diagnostics()
