import { groq } from '@/services/groq';

export type TriageResult = {
  summary: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

const DEFAULT_TRIAGE: TriageResult = {
  summary: 'Needs review',
  action: 'Review manually',
  severity: 'medium'
};

const normalizeSeverity = (severity: unknown): TriageResult['severity'] => {
  if (severity === 'low' || severity === 'medium' || severity === 'high' || severity === 'critical') {
    return severity;
  }
  return DEFAULT_TRIAGE.severity;
};

type TriagePayload = Partial<TriageResult> & { severity?: unknown };

function parseTriageResponse(rawContent: unknown): TriageResult {
  let payload: TriagePayload = {};

  if (typeof rawContent === 'string') {
    try {
      payload = JSON.parse(rawContent) as TriagePayload;
    } catch {
      return DEFAULT_TRIAGE;
    }
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    payload = rawContent as TriagePayload;
  } else {
    return DEFAULT_TRIAGE;
  }

  return {
    summary: typeof payload.summary === 'string' ? payload.summary : DEFAULT_TRIAGE.summary,
    action: typeof payload.action === 'string' ? payload.action : DEFAULT_TRIAGE.action,
    severity: normalizeSeverity(payload.severity)
  };
}

export const triageService = {
  analyzeIncident: async (incident: { type: string; zone: string; description: string }): Promise<TriageResult> => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              'You are an AI Incident Triage assistant for a stadium. Given an incident description, return a JSON object with `summary` (a 1-sentence summary), `action` (recommended action), and `severity` (low, medium, high, or critical).'
          },
          {
            role: 'user',
            content: `Type: ${incident.type}, Location: ${incident.zone}, Description: ${incident.description}`
          }
        ],
        model: 'llama3-8b-8192',
        response_format: { type: 'json_object' }
      });

      const rawContent = completion.choices?.[0]?.message?.content;
      return parseTriageResponse(rawContent);
    } catch (error) {
      console.error('Triage AI Error:', error);
      return DEFAULT_TRIAGE;
    }
  }
};
