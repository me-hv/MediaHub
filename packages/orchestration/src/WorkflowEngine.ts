export interface WorkflowStep<TInput = any, TOutput = any> {
  name: string;
  execute(input: TInput): Promise<TOutput>;
  rollback?(input: TInput, error: Error): Promise<void>;
}

export class WorkflowEngine {
  private steps: WorkflowStep[] = [];

  addStep<TIn, TOut>(step: WorkflowStep<TIn, TOut>): this {
    this.steps.push(step);
    return this;
  }

  async executeWorkflow<TInitial>(initialState: TInitial): Promise<{ success: boolean; result: any; completedSteps: string[] }> {
    let currentState: any = initialState;
    const completedSteps: string[] = [];

    for (const step of this.steps) {
      try {
        currentState = await step.execute(currentState);
        completedSteps.push(step.name);
      } catch (err: any) {
        if (step.rollback) {
          await step.rollback(currentState, err).catch(() => {});
        }
        return {
          success: false,
          result: { error: err.message, failedAtStep: step.name },
          completedSteps,
        };
      }
    }

    return {
      success: true,
      result: currentState,
      completedSteps,
    };
  }
}
