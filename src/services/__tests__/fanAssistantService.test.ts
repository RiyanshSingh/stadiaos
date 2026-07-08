import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFanAssistantService } from '../fanAssistantService';
import { groq } from '@/services/groq';

vi.mock('@/services/groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

vi.mock('@/services/dashboardService', () => ({
  dashboardService: {
    getLiveStatusCards: vi.fn().mockResolvedValue({
      gate: { gate: 'A', waitTime: 1, crowd: 'Low' },
      food: { amenities: { name: 'Food Stall' }, estimated_wait_minutes: 2 },
      washroom: { amenities: { name: 'Washroom' }, estimated_wait_minutes: 3 }
    })
  }
}));

vi.mock('@/store/useAppStore', () => ({
  default: {
    getState: vi.fn(() => ({
      profile: { full_name: 'Test Fan' },
      ticket: { seat_section: '214', seat_row: 'F', seat_number: '12' },
      match: { id: 'match-1', stadium_id: 'stadium-1' }
    }))
  }
}));

describe('fanAssistantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const addMessage = useFanAssistantService.getState().addMessage;
    useFanAssistantService.setState({
      messages: [
        {
          id: 'welcome-1',
          role: 'assistant',
          content: "Hi! I am your Nexora Copilot. I can help you find your seat, locate the nearest amenities with the shortest lines, or assist with any emergencies. How can I help you today?",
          timestamp: new Date()
        }
      ],
      isTyping: false,
      addMessage
    });
  });

  it('adds a user message and appends AI reply when Groq succeeds', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: 'Head to the nearest washroom by Gate A.' } }]
    } as any);

    const initialMessages = useFanAssistantService.getState().messages.length;
    await useFanAssistantService.getState().addMessage({ role: 'user', content: 'Where is the nearest washroom?' });

    const state = useFanAssistantService.getState();
    expect(state.messages.length).toBe(initialMessages + 2);
    expect(state.messages[state.messages.length - 1].content).toBe('Head to the nearest washroom by Gate A.');
    expect(state.isTyping).toBe(false);
  });

  it('adds a fallback error response when Groq fails', async () => {
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('API failed'));

    await useFanAssistantService.getState().addMessage({ role: 'user', content: 'Help!' });

    const state = useFanAssistantService.getState();
    const lastMessage = state.messages[state.messages.length - 1];
    expect(lastMessage.role).toBe('assistant');
    expect(lastMessage.content).toContain('Sorry, I encountered an error while thinking.');
    expect(state.isTyping).toBe(false);
  });
});
