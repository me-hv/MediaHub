export type CronTaskHandler = () => Promise<void>;

export class SchedulerService {
  private tasks: Map<string, { intervalMs: number; handler: CronTaskHandler }> = new Map();

  registerTask(name: string, intervalMs: number, handler: CronTaskHandler) {
    this.tasks.set(name, { intervalMs, handler });
  }

  async runTask(name: string): Promise<boolean> {
    const task = this.tasks.get(name);
    if (!task) return false;
    await task.handler();
    return true;
  }

  getTaskNames(): string[] {
    return Array.from(this.tasks.keys());
  }
}

export const globalScheduler = new SchedulerService();
