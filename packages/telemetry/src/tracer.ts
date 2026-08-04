export class OpenTelemetryTracer {
  private static serviceName = 'mediahub-api';

  static startSpan(name: string, attributes?: Record<string, any>) {
    const traceId = `trc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startTime = Date.now();
    return {
      traceId,
      name,
      attributes,
      end: (error?: Error) => {
        const duration = Date.now() - startTime;
        if (error) {
          console.log(`[OTEL TRACE] ${name} (${traceId}) FAILED in ${duration}ms: ${error.message}`);
        } else {
          console.log(`[OTEL TRACE] ${name} (${traceId}) SUCCESS in ${duration}ms`);
        }
      },
    };
  }
}
