import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

export class MediaHubMetrics {
  private static registry = new Registry();

  public static downloadsTotal = new Counter({
    name: 'mediahub_downloads_total',
    help: 'Total count of media downloads',
    labelNames: ['platform', 'format'],
    registers: [MediaHubMetrics.registry],
  });

  public static downloadBytesTotal = new Counter({
    name: 'mediahub_download_bytes_total',
    help: 'Total bytes streamed to clients',
    registers: [MediaHubMetrics.registry],
  });

  public static downloadDuration = new Histogram({
    name: 'mediahub_download_duration_seconds',
    help: 'Media download stream duration in seconds',
    buckets: [1, 5, 15, 30, 60, 120, 300],
    registers: [MediaHubMetrics.registry],
  });

  public static queueDepth = new Gauge({
    name: 'mediahub_queue_depth',
    help: 'Current active and pending queue depth',
    registers: [MediaHubMetrics.registry],
  });

  public static activeWorkers = new Gauge({
    name: 'mediahub_active_workers',
    help: 'Current active queue workers executing tasks',
    registers: [MediaHubMetrics.registry],
  });

  public static cacheHits = new Counter({
    name: 'mediahub_cache_hits_total',
    help: 'Total metadata cache hits',
    registers: [MediaHubMetrics.registry],
  });

  public static cacheMisses = new Counter({
    name: 'mediahub_cache_misses_total',
    help: 'Total metadata cache misses',
    registers: [MediaHubMetrics.registry],
  });

  public static errorsTotal = new Counter({
    name: 'mediahub_errors_total',
    help: 'Total errors encountered by code',
    labelNames: ['code'],
    registers: [MediaHubMetrics.registry],
  });

  static init() {
    collectDefaultMetrics({ register: MediaHubMetrics.registry });
  }

  static async getMetricsText(): Promise<string> {
    return MediaHubMetrics.registry.metrics();
  }
}

MediaHubMetrics.init();
