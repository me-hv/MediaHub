export interface WorkflowTask<TInput = any, TOutput = any> {
  name: string;
  execute(input: TInput): Promise<TOutput>;
  rollback?(input: TInput, error: Error): Promise<void>;
}

export class WorkflowEngine {
  private tasks: WorkflowTask[] = [];

  addTask<TIn, TOut>(task: WorkflowTask<TIn, TOut>): this {
    this.tasks.push(task);
    return this;
  }

  async executeWorkflow<TInitial>(initialState: TInitial): Promise<{ success: boolean; result: any; completedTasks: string[] }> {
    let currentState: any = initialState;
    const completedTasks: string[] = [];

    for (const task of this.tasks) {
      try {
        currentState = await task.execute(currentState);
        completedTasks.push(task.name);
      } catch (err: any) {
        if (task.rollback) {
          await task.rollback(currentState, err).catch(() => {});
        }
        return {
          success: false,
          result: { error: err.message, failedAtTask: task.name },
          completedTasks,
        };
      }
    }

    return {
      success: true,
      result: currentState,
      completedTasks,
    };
  }
}
