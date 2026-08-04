import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/WorkflowEngine';

describe('WorkflowEngine', () => {
  it('should execute pipeline steps sequentially', async () => {
    const engine = new WorkflowEngine();

    engine
      .addStep({
        name: 'AnalyzeStep',
        execute: async (url: string) => ({ url, title: 'Sample Video' }),
      })
      .addStep({
        name: 'DownloadStep',
        execute: async (state: any) => ({ ...state, downloaded: true }),
      });

    const res = await engine.executeWorkflow('https://youtube.com/watch?v=123');
    expect(res.success).toBe(true);
    expect(res.completedSteps).toEqual(['AnalyzeStep', 'DownloadStep']);
    expect(res.result.downloaded).toBe(true);
  });

  it('should trigger rollback on step failure', async () => {
    const engine = new WorkflowEngine();
    let rolledBack = false;

    engine.addStep({
      name: 'FailingStep',
      execute: async () => {
        throw new Error('Pipeline error');
      },
      rollback: async () => {
        rolledBack = true;
      },
    });

    const res = await engine.executeWorkflow({});
    expect(res.success).toBe(false);
    expect(rolledBack).toBe(true);
  });
});
