export type ShutdownHandler = () => Promise<void>;

export class GracefulShutdownManager {
  private handlers: Array<{ name: string; fn: ShutdownHandler }> = [];
  private isShuttingDown = false;

  register(name: string, fn: ShutdownHandler) {
    this.handlers.push({ name, fn });
  }

  setupSignalListeners(onStartShutdown?: () => void) {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      console.log(`\n🛑 Graceful shutdown initiated by ${signal}...`);
      if (onStartShutdown) onStartShutdown();

      for (const handler of this.handlers.reverse()) {
        try {
          console.log(` Closing ${handler.name}...`);
          await handler.fn();
        } catch (err: any) {
          console.error(` Error closing ${handler.name}:`, err.message);
        }
      }

      console.log(' Clean shutdown completed. Exiting process.');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

export const globalShutdownManager = new GracefulShutdownManager();
