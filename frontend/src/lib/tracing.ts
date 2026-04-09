import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { 
  getUserId, 
  getSessionId, 
  getOrgId, 
  getContractId,
  getEnvironment 
} from './context';

import type { Span } from '@opentelemetry/api';

const serviceName = 'contract-agent-frontend';

export const initTracing = () => {
  // Stable 1.x Resource initialization
  const appResource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: serviceName,
    'deployment.environment': getEnvironment(),
  });

  const provider = new WebTracerProvider({
    resource: appResource,
  });

  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:6006/v1/traces',
  });

  provider.addSpanProcessor(new BatchSpanProcessor(exporter));

  const fetchInstrumentationConfig = {
    propagateTraceHeaderCorsUrls: [
      /http:\/\/localhost:8000\/.*/,
      /^\/api\/.*/,
    ],
    clearTimingResources: true,
    // Using the supported attribute hook for this instrumentation version
    applyCustomAttributesOnSpan: (span: Span, _request: Request | RequestInit, _response: Response | any) => {
      const userId = getUserId();
      const sessionId = getSessionId();
      const orgId = getOrgId();
      const contractId = getContractId();

      // Enrich the span with enterprise context
      span.setAttribute('user_id', userId);
      span.setAttribute('session_id', sessionId);
      span.setAttribute('org_id', orgId);
      if (contractId) span.setAttribute('contract_id', contractId);
      
      // Note: Header injection via FetchInstrumentationConfig is version-dependent.
      // In this version, we focus on Span Attributes for Phoenix tracing.
    }
  };

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation(fetchInstrumentationConfig),
    ],
    tracerProvider: provider,
  });

  provider.register();
  
  console.log('🌐 OpenTelemetry Tracing initialized (Stable 1.x)');
};
