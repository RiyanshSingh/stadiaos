import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triageService } from '../triageService';

vi.mock('@/services/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

describe('triageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses AI triage completion JSON successfully', async () => {
    const { groq } = await import('@/services/groq');
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"summary":"User needs help","action":"Dispatch security","severity":"high"}' } }]
    } as any);

    const result = await triageService.analyzeIncident({ type: 'crowd_disturbance', zone: 'Zone A', description: 'Crowd is pushing through the gate.' });
    expect(result).toEqual({ summary: 'User needs help', action: 'Dispatch security', severity: 'high' });
  });

  it('returns fallback triage when Groq fails', async () => {
    const { groq } = await import('@/services/groq');
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('AI down'));

    const result = await triageService.analyzeIncident({ type: 'medical', zone: 'Zone B', description: 'Fan collapsed.' });
    expect(result).toEqual({ summary: 'Needs review', action: 'Review manually', severity: 'medium' });
  });
});
