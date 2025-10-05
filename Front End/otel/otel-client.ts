// otel/otel-client.ts
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';

const provider = new WebTracerProvider();

const exporter = new OTLPTraceExporter({
  // url: 'http://localhost:4318/v1/traces', // default, change if needed
});

provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation(),
    new DocumentLoadInstrumentation(),
    new UserInteractionInstrumentation(),
    new XMLHttpRequestInstrumentation(),
  ],
});