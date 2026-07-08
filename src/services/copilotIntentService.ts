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

const VALID_INTENTS = ['FACILITY_LOOKUP', 'ROUTE_HANDOFF', 'INCIDENT_DRAFT', 'ALERTS_STATUS', 'TICKET_CONTEXT', 'VENUE_FAQ', 'UNKNOWN'] as const;

type ValidIntent = (typeof VALID_INTENTS)[number];

function isValidIntent(intent: unknown): intent is ValidIntent {
  return typeof intent === 'string' && VALID_INTENTS.includes(intent as ValidIntent);
}

function extractDestination(msg: string): string | undefined {
  const lowerMsg = msg.toLowerCase();
  const seatMatch = lowerMsg.match(/(?:my\s*)?(seat|section\s*\d+|row\s*[a-z0-9]+)/);
  if (seatMatch) {
    return 'my seat';
  }

  const gateMatch = lowerMsg.match(/gate\s*([a-z0-9]+)/);
  if (gateMatch) {
    return `gate ${gateMatch[1].toUpperCase()}`;
  }

  if (lowerMsg.includes('main gate') || lowerMsg.includes('front gate')) {
    return 'gate A';
  }

  if (lowerMsg.includes('exit')) {
    return 'nearest exit';
  }

  if (lowerMsg.includes('concourse')) {
    return 'nearest concourse';
  }

  if (lowerMsg.includes('vip') || lowerMsg.includes('premium')) {
    return 'VIP entrance';
  }

  return undefined;
}

function extractIncidentSeverity(msg: string): CopilotIntent['severity'] {
  const lowerMsg = msg.toLowerCase();
  if (lowerMsg.match(/(critical|life threatening|severe|urgent|immediately|dangerous)/)) {
    return 'critical';
  }
  if (lowerMsg.match(/(high|serious|major|very bad|fainted|collapse|hurt|medical)/)) {
    return 'high';
  }
  if (lowerMsg.match(/(spill|wet floor|slow|lost|leave|security)/)) {
    return 'medium';
  }
  return 'low';
}

function extractIncidentLocation(msg: string): string | undefined {
  const lowerMsg = msg.toLowerCase();
  const sectionMatch = lowerMsg.match(/section\s*\d+/);
  if (sectionMatch) return sectionMatch[0];
  const rowMatch = lowerMsg.match(/row\s*[a-z0-9]+/);
  if (rowMatch) return rowMatch[0];
  const nearMatch = lowerMsg.match(/near\s+([a-z0-9\s]+)/);
  if (nearMatch) return nearMatch[1].trim();
  return undefined;
}

function fallbackParse(msg: string): CopilotIntent {
  const lowerMsg = msg.toLowerCase();

  if (lowerMsg.match(/(washroom|restroom|toilet|food|drink|coffee|medical)/)) {
    let type = 'washroom';
    if (lowerMsg.match(/(food|drink|coffee|restaurant|concession|snack)/)) type = 'food';
    if (lowerMsg.match(/medical|first aid|help desk/)) type = 'medical';
    if (lowerMsg.match(/(toilet|restroom|washroom)/)) type = 'washroom';
    return { intent: 'FACILITY_LOOKUP', facility_type: type };
  }

  if (lowerMsg.match(/(fainted|emergency|security|help|incident|medical issue|lost person|hazard|spill|fire|injured|collapse)/)) {
    const incidentType = lowerMsg.match(/(medical|fainted|spill|harassment|lost child|security|fire|hazard|injury|injured)/)?.[1] ?? 'general';
    const normalizedType = incidentType === 'fainted' ? 'medical' : incidentType;
    return {
      intent: 'INCIDENT_DRAFT',
      description: msg,
      incident_type: normalizedType,
      location: extractIncidentLocation(msg),
      severity: extractIncidentSeverity(msg)
    };
  }

  if (lowerMsg.match(/(alert|warning|congestion|happening|issue|delay|advisory|current alert)/)) {
    return { intent: 'ALERTS_STATUS' };
  }

  if (lowerMsg.match(/(route|take me|how do i get|directions|gate|exit|seat|my seat|wheelchair|accessible|accessibility)/)) {
    return { intent: 'ROUTE_HANDOFF', destination: extractDestination(msg) ?? 'your destination' };
  }

  if (lowerMsg.match(/(seat|sitting|ticket|section|row|my ticket|where am i|where am i sitting)/)) {
    return { intent: 'TICKET_CONTEXT' };
  }

  if (lowerMsg.match(/(bag|bottle|policy|allowed|power bank|accessibility|patrons|staff|rules|entry|security check)/)) {
    return { intent: 'VENUE_FAQ', question: msg };
  }

  return { intent: 'UNKNOWN' };
}

type IntentResponse = Partial<CopilotIntent> & { intent?: unknown };

type TriageSeverity = CopilotIntent['severity'];

const normalizeSeverity = (value: unknown): TriageSeverity | undefined => {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') {
    return value;
  }
  return undefined;
};

function parseIntentResponse(rawContent: unknown, userMessage: string): CopilotIntent {
  if (typeof rawContent !== 'string') {
    return fallbackParse(userMessage);
  }

  try {
    const payload = JSON.parse(rawContent) as IntentResponse;
    const intent = isValidIntent(payload.intent) ? payload.intent : 'UNKNOWN';

    if (intent === 'UNKNOWN') {
      return fallbackParse(userMessage);
    }

    return {
      intent,
      facility_type: typeof payload.facility_type === 'string' ? payload.facility_type : undefined,
      destination: typeof payload.destination === 'string' ? payload.destination : undefined,
      incident_type: typeof payload.incident_type === 'string' ? payload.incident_type : undefined,
      description: typeof payload.description === 'string' ? payload.description : undefined,
      location: typeof payload.location === 'string' ? payload.location : undefined,
      severity: normalizeSeverity(payload.severity),
      question: typeof payload.question === 'string' ? payload.question : undefined
    };
  } catch {
    return fallbackParse(userMessage);
  }
}

export const copilotIntentService = {
  extractIntent: async (userMessage: string): Promise<CopilotIntent> => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ],
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' }
      });

      const content = completion.choices?.[0]?.message?.content;
      const parsed = parseIntentResponse(content, userMessage);

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
