import { groq } from './groq';
import type { CopilotIntent } from '../lib/types/copilot';

const SYSTEM_PROMPT = `
You are the StadiaOS Fan Copilot Intent Classifier.
Your ONLY job is to classify the user's message into one of the allowed intents and extract relevant parameters.
Return a JSON object that strictly adheres to this schema:
{
  "intent": "FACILITY_LOOKUP" | "ROUTE_HANDOFF" | "INCIDENT_DRAFT" | "ALERTS_STATUS" | "TICKET_CONTEXT" | "VENUE_FAQ" | "UNKNOWN",
  "facility_type": string (optional, for FACILITY_LOOKUP, e.g., "food", "washroom", "medical", "gate"),
  "destination": string (optional, for ROUTE_HANDOFF),
  "incident_type": string (optional, for INCIDENT_DRAFT, e.g., "medical", "spill", "harassment"),
  "description": string (optional, for INCIDENT_DRAFT, summarize the issue),
  "location": string (optional, for INCIDENT_DRAFT, extracted location hint),
  "severity": "low" | "medium" | "high" | "critical" (optional, for INCIDENT_DRAFT),
  "question": string (optional, for VENUE_FAQ)
}

Rules:
- If the user asks for the nearest washroom, food, concessions, or medical: FACILITY_LOOKUP.
- If the user asks to be taken somewhere, routed to their seat, or asks about a GATE or EXIT: ROUTE_HANDOFF.
- If the user reports an emergency, spill, lost child, or hazard: INCIDENT_DRAFT.
- If the user asks about stadium alerts, delays, or issues: ALERTS_STATUS.
- If the user asks about their ticket, seat number, or where they are sitting: TICKET_CONTEXT.
- If the user asks about stadium policies, allowed items, bags, or accessibility: VENUE_FAQ.
- If it's none of these, or generic chat, return UNKNOWN. Do not try to answer general knowledge questions.
`;

function fallbackParse(msg: string): CopilotIntent {
  const lowerMsg = msg.toLowerCase();
  
  if (lowerMsg.match(/(washroom|restroom|toilet|food|drink|coffee|medical)/)) {
    let type = 'washroom';
    if (lowerMsg.match(/(food|drink|coffee)/)) type = 'food';
    if (lowerMsg.match(/medical/)) type = 'medical';
    return { intent: 'FACILITY_LOOKUP', facility_type: type };
  }
  
  if (lowerMsg.match(/(fainted|emergency|security|help|incident|medical issue|lost person)/)) {
    return { intent: 'INCIDENT_DRAFT', description: msg, incident_type: 'general', severity: 'medium' };
  }
  
  if (lowerMsg.match(/(alert|warning|congestion|happening|issue)/)) {
    return { intent: 'ALERTS_STATUS' };
  }
  
  if (lowerMsg.match(/(route|take me|how do i get|directions|gate)/)) {
    return { intent: 'ROUTE_HANDOFF', destination: 'your destination' };
  }

  if (lowerMsg.match(/(seat|sitting|ticket|section|row)/)) {
    return { intent: 'TICKET_CONTEXT' };
  }
  
  if (lowerMsg.match(/(bag|bottle|policy|allowed|power bank|accessibility)/)) {
    return { intent: 'VENUE_FAQ', question: msg };
  }

  return { intent: 'UNKNOWN' };
}

export const copilotIntentService = {
  extractIntent: async (userMessage: string): Promise<CopilotIntent> => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.1-8b-instant', // Fast model for JSON extraction
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content || '{}';
      let parsed = JSON.parse(content) as CopilotIntent;
      
      // Ensure the intent is valid
      const validIntents = ['FACILITY_LOOKUP', 'ROUTE_HANDOFF', 'INCIDENT_DRAFT', 'ALERTS_STATUS', 'TICKET_CONTEXT', 'VENUE_FAQ', 'UNKNOWN'];
      if (!validIntents.includes(parsed.intent)) {
        parsed.intent = 'UNKNOWN';
      }
      
      if (parsed.intent === 'UNKNOWN') {
        parsed = fallbackParse(userMessage);
      }
      
      console.log('[Copilot Pipeline] Input:', userMessage);
      console.log('[Copilot Pipeline] Intent:', parsed.intent);
      
      return parsed;
    } catch (error) {
      console.error('Groq Intent Parsing Error:', error);
      const fallback = fallbackParse(userMessage);
      console.log('[Copilot Pipeline] Input:', userMessage);
      console.log('[Copilot Pipeline] Intent (Fallback):', fallback.intent);
      return fallback;
    }
  }
};
