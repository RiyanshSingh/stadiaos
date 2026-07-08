import { create } from 'zustand';
import { groq } from '@/services/groq';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface FanAssistantState {
  messages: Message[];
  isTyping: boolean;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
}

export const useFanAssistantService = create<FanAssistantState>((set, get) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I am your Nexora Copilot. I can help you find your seat, locate the nearest amenities with the shortest lines, or assist with any emergencies. How can I help you today?',
      timestamp: new Date(),
    }
  ],
  isTyping: false,
  addMessage: async (msg) => {
    const newMessage: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    set((state) => ({ messages: [...state.messages, newMessage] }));
    
    if (msg.role === 'user') {
      set({ isTyping: true });
      try {
        const state = get();
        // Dynamic import to avoid circular dependency if any, but since we are inside a function, direct require/import works, or just get from useAppStore
        const { useAppStore } = await import('@/store/useAppStore');
        const appStore = useAppStore.getState();
        const { profile, ticket, match } = appStore;
        const userName = profile?.full_name || 'Fan';
        const ticketInfo = ticket ? `Section ${ticket.seat_section}, Row ${ticket.seat_row}, Seat ${ticket.seat_number}` : 'No active ticket';
        const conversation = state.messages.map((m: any) => ({ role: m.role, content: m.content }));

        const { dashboardService } = await import('@/services/dashboardService');
        const matchId = match?.id;
        let stadiumContext = 'No live match context available.';
        if (matchId) {
          const status = await dashboardService.getLiveStatusCards(matchId);
          stadiumContext = `
- Least congested gate: ${status.gate ? `${status.gate.gate} (${status.gate.waitTime}m wait, ${status.gate.crowd} crowd)` : 'Unknown'}
- Nearest Food: ${status.food ? `${status.food.amenities?.name} (${status.food.estimated_wait_minutes}m wait)` : 'Unknown'}
- Nearest Washroom: ${status.washroom ? `${status.washroom.amenities?.name} (${status.washroom.estimated_wait_minutes}m wait)` : 'Unknown'}`;
        }
        
        const systemPrompt = `You are the Nexora Fan Copilot, a highly smart and personalized stadium assistant.
        
Current Context:
- User's Name: ${userName}
- User's Ticket: ${ticketInfo}
- Stadium Status: ${stadiumContext}

CRITICAL INSTRUCTIONS:
1. Pay close attention to keywords in the user's message (e.g., 'food', 'washroom', 'emergency', 'seat', 'gate', 'route').
2. Provide personalized guidance using their ticket information and the current context. Answer smartly based on keywords. Keep answers helpful and concise.
3. STRICTLY DENY answering any queries that are NOT related to the match, the stadium, or the Nexora project (e.g., coding, general knowledge, outside news, etc.). If a user asks something unrelated, politely and warmly deny the request, guiding them back to stadium-related topics.
4. In an emergency, strictly ask them to use the Report Incident button.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversation
          ],
          model: 'llama3-8b-8192',
        });
        
        const reply = completion.choices[0]?.message?.content || "I'm having trouble connecting right now.";
        
        set((state) => ({
          messages: [...state.messages, {
            id: Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: reply,
            timestamp: new Date()
          }],
          isTyping: false
        }));
      } catch (error) {
        console.error("Groq AI Error:", error);
        set((state) => ({
          messages: [...state.messages, {
            id: Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: "Sorry, I encountered an error while thinking.",
            timestamp: new Date()
          }],
          isTyping: false
        }));
      }
    }
  }
}));
