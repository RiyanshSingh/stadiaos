import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copilotIntentService } from '../copilotIntentService';
import { groq } from '../groq';

vi.mock('../groq', () => ({
  groq: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

describe('copilotIntentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to local parser when Groq fails', async () => {
    // Mock Groq to throw an error
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('API failed'));

    // Test each local fallback path
    
    // 1. nearest washroom -> FACILITY_LOOKUP
    const washroomIntent = await copilotIntentService.extractIntent('nearest washroom');
    expect(washroomIntent.intent).toBe('FACILITY_LOOKUP');
    expect(washroomIntent.facility_type).toBe('washroom');

    // 2. any alerts right now -> ALERTS_STATUS
    const alertsIntent = await copilotIntentService.extractIntent('any alerts right now?');
    expect(alertsIntent.intent).toBe('ALERTS_STATUS');

    // 3. where am i sitting -> TICKET_CONTEXT
    const ticketIntent = await copilotIntentService.extractIntent('where am i sitting?');
    expect(ticketIntent.intent).toBe('TICKET_CONTEXT');

    // 4. take me to gate a -> ROUTE_HANDOFF
    const routeIntent = await copilotIntentService.extractIntent('take me to gate a');
    expect(routeIntent.intent).toBe('ROUTE_HANDOFF');

    // 5. someone fainted near section 214 -> INCIDENT_DRAFT
    const incidentIntent = await copilotIntentService.extractIntent('someone fainted near section 214');
    expect(incidentIntent.intent).toBe('INCIDENT_DRAFT');
    expect(incidentIntent.incident_type).toBe('medical');
    expect(incidentIntent.location).toBe('section 214');
  });

  it('falls back to local parser when Groq returns UNKNOWN', async () => {
    // Mock Groq to return UNKNOWN
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"intent":"UNKNOWN"}' } }]
    } as any);

    const washroomIntent = await copilotIntentService.extractIntent('nearest washroom');
    expect(washroomIntent.intent).toBe('FACILITY_LOOKUP');
    expect(washroomIntent.facility_type).toBe('washroom');
  });

  it('returns UNKNOWN if both Groq and fallback fail to classify', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"intent":"UNKNOWN"}' } }]
    } as any);

    const unknownIntent = await copilotIntentService.extractIntent('what is the capital of france?');
    expect(unknownIntent.intent).toBe('UNKNOWN');
  });

  it('uses Groq parsed intent when successful', async () => {
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"intent":"FACILITY_LOOKUP","facility_type":"medical"}' } }]
    } as any);

    const intent = await copilotIntentService.extractIntent('where is the first aid?');
    expect(intent.intent).toBe('FACILITY_LOOKUP');
    expect(intent.facility_type).toBe('medical');
  });

  it('extracts gate destination in route fallback mode', async () => {
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('API failed'));

    const intent = await copilotIntentService.extractIntent('take me to gate c');
    expect(intent.intent).toBe('ROUTE_HANDOFF');
    expect(intent.destination).toBe('gate C');
  });

  it('extracts severity and location from incident descriptions', async () => {
    vi.mocked(groq.chat.completions.create).mockRejectedValue(new Error('API failed'));

    const intent = await copilotIntentService.extractIntent('someone fainted near section 214 and needs help immediately');
    expect(intent.intent).toBe('INCIDENT_DRAFT');
    expect(intent.severity).toBe('critical');
    expect(intent.location).toContain('section 214');
    expect(intent.incident_type).toBe('medical');
  });
});
