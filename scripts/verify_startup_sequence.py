import asyncio
import sys
import os
import time
import requests
import uuid
from opentelemetry import trace, propagate
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.trace import Status, StatusCode

# Initialize OTEL as the "Simulated Browser"
phoenix_endpoint = os.environ.get("PHOENIX_COLLECTOR_ENDPOINT", "http://localhost:6006/v1/traces")
tracer_provider = TracerProvider()
tracer_provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=phoenix_endpoint)))
trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer("startup_verifier")

def run_startup_test():
    with tracer.start_as_current_span("Simulated Browser Session") as parent_span:
        # Mock Context
        user_id = "user_rajsa_verifier"
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        org_id = "org_enterprise_corp"
        contract_id = "cont_verify_123"

        parent_span.set_attribute("user_id", user_id)
        parent_span.set_attribute("session_id", session_id)
        parent_span.set_attribute("org_id", org_id)
        parent_span.set_attribute("contract_id", contract_id)

        print(f"🚀 Starting Startup Sequence Verification...")
        trace_id = format(parent_span.get_span_context().trace_id, '032x')
        print(f"🔍 Trace ID: {trace_id}")
        print(f"🔗 View in Phoenix: http://localhost:6006/traces/{trace_id}\n")

        with tracer.start_as_current_span("Fetch /api/monitoring/system/health") as fetch_span:
            # Inject W3C traceparent and custom identifiers
            headers = {
                "X-Correlation-ID": trace_id,
                "X-User-ID": user_id,
                "X-Session-ID": session_id,
                "X-Org-ID": org_id,
                "X-Contract-ID": contract_id
            }
            propagate.inject(headers)
            
            print("Sending health check request...")
            start = time.time()
            try:
                # We assume the server is running on localhost:8000
                response = requests.get("http://localhost:8000/api/monitoring/system/health", headers=headers, timeout=30)
                latency = (time.time() - start) * 1000
                fetch_span.set_attribute("http.status_code", response.status_code)
                fetch_span.set_attribute("http.latency_ms", latency)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Response received in {latency:.2f}ms")
                    print("\n--- Agent Verification ---")
                    
                    all_ok = True
                    for res in data.get("results", []):
                        status = "OK" if res["status_code"] == 200 else "FAIL"
                        print(f"[{status}] {res['agent_name']} ({res['component']}) - {res['latency_ms']}ms")
                        if res["status_code"] != 200:
                            all_ok = False
                            print(f"      Err: {res['system_error']}")
                    
                    if all_ok:
                        print("\n🏁 Startup Verification: SUCCESS")
                        fetch_span.set_status(Status(StatusCode.OK))
                    else:
                        print("\n❌ Startup Verification: PARTIAL FAILURE")
                        fetch_span.set_status(Status(StatusCode.ERROR, "Partial infrastructure failure"))
                else:
                    print(f"❌ Server returned {response.status_code}")
                    fetch_span.set_status(Status(StatusCode.ERROR, f"HTTP {response.status_code}"))
                    
            except Exception as e:
                print(f"❌ Connection failed: {e}")
                fetch_span.set_status(Status(StatusCode.ERROR, str(e)))

if __name__ == "__main__":
    # Ensure span is exported before exit
    run_startup_test()
    tracer_provider.shutdown()
