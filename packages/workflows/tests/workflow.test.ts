import { describe, it, expect } from 'vitest';
import { WorkflowEngine } from '../src/WorkflowEngine';

describe('WorkflowEngine', () => {
  it('should execute workflow tasks sequentially', async () => {
    const engine = new WorkflowEngine();

    engine
      .addTask({
        name: 'AnalyzeTask',
        execute: async (url: string) => ({ url, title: 'Sample Video' }),
      })
      .addTask({
        name: 'DownloadTask',
        execute: async (state: any) => ({ ...state, downloaded: true }),
      });

    const res = await engine.executeWorkflow('https://youtube.com/watch?v=123');
    expect(res.success).toBe(true);
    expect(res.completedTasks).toEqual(['AnalyzeTask', 'DownloadTask']);
    expect(res.result.downloaded).toBe(true);
  });
});
