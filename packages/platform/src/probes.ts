export interface ReadinessStatus {
  database: 'healthy' | 'unhealthy';
  redis: 'healthy' | 'unhealthy';
  storage: 'healthy' | 'unhealthy';
  queue: 'healthy' | 'unhealthy';
}

export class PlatformProbes {
  static getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  static getReadiness(deps: ReadinessStatus) {
    const isReady = Object.values(deps).every((val) => val === 'healthy');
    return {
      ready: isReady,
      status: isReady ? 'ready' : 'degraded',
      dependencies: deps,
      timestamp: new Date().toISOString(),
    };
  }
}
