import { groq } from '@/services/groq';

export const triageService = {
  analyzeIncident: async (incident: any) => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI Incident Triage assistant for a stadium. Given an incident description, return a JSON object with `summary` (a 1-sentence summary), `action` (recommended action), and `severity` (low, medium, high, or critical).' },
          { role: 'user', content: `Type: ${incident.type}, Location: ${incident.zone}, Description: ${incident.description}` }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' }
      });
      
      return JSON.parse(completion.choices[0]?.message?.content || '{"summary":"Needs review","action":"Dispatch team","severity":"medium"}');
    } catch (e) {
      console.error("Triage AI Error:", e);
      return { summary: "Needs review", action: "Review manually", severity: "medium" };
    }
  }
};
