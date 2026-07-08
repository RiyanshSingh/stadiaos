import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copilotResolver } from '../copilotResolver';
import { copilotIntentService } from '../copilotIntentService';
import { facilityService } from '../facilityService';
import { routingService } from '../routing/routingService';

vi.mock('../copilotIntentService');
vi.mock('../facilityService');
vi.mock('../alertService');
vi.mock('../routing/routingService');
vi.mock('../../store/useAppStore', () => ({
  useAppStore: {
    getState: vi.fn().mockReturnValue({ ticket: { seat_section: '102' } })
  }
}));

describe('copilotResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves FACILITY_LOOKUP to a facility_card', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'FACILITY_LOOKUP',
      facility_type: 'washroom'
    });
    
    vi.mocked(facilityService.fetchFacilities).mockResolvedValue([
      { id: '1', name: 'Washroom A', type: 'washroom', wait: '5 mins', crowd: 'Low', zone: 'Zone A', distance: 'TBD', accessible: true }
    ]);

    const result = await copilotResolver.processUserMessage('where is the washroom', 'match-1', 'stadium-1');

    expect(result.type).toBe('facility_card');
    expect(result.data).toBeDefined();
    expect(result.data.name).toBe('Washroom A');
    expect(result.data.wait).toBe('5 mins');
  });

  it('resolves INCIDENT_DRAFT to an incident_card', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'INCIDENT_DRAFT',
      incident_type: 'medical',
      description: 'someone fainted',
      location: 'near section 214',
      severity: 'high'
    });

    const result = await copilotResolver.processUserMessage('someone fainted near section 214', 'match-1', 'stadium-1');

    expect(result.type).toBe('incident_card');
    expect(result.data).toBeDefined();
    expect(result.data.incidentType).toBe('medical');
    expect(result.data.severity).toBe('high');
    expect(result.data.requiresConfirmation).toBe(true);
  });

  it('resolves ROUTE_HANDOFF to a route_card with calculated ETA', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'ROUTE_HANDOFF',
      destination: 'my seat'
    });

    vi.mocked(routingService.computeRoute).mockReturnValue({
      ok: true,
      etaMinutes: 4,
      distanceMeters: 300,
      steps: [],
      polyline: [],
      sourceLabel: 'Gate A',
      destinationLabel: 'Section 102'
    } as any);

    const result = await copilotResolver.processUserMessage('take me to my seat', 'match-1', 'stadium-1');

    expect(result.type).toBe('route_card');
    expect(result.data).toBeDefined();
    expect((result.data as any).destinationLabel).toBe('my seat');
    expect((result.data as any).eta).toBe('4 mins');
    expect((result.data as any).distance).toBe('300m');
  });
  
  it('resolves UNKNOWN intent to a fallback text message', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'UNKNOWN'
    });

    const result = await copilotResolver.processUserMessage('what is the meaning of life', 'match-1', 'stadium-1');

    expect(result.type).toBe('text');
    expect(result.content).toContain('I am the StadiaOS Copilot');
  });
});
