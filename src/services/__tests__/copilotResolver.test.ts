import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copilotResolver } from '../copilotResolver';
import { copilotIntentService } from '../copilotIntentService';
import { facilityService } from '../facilityService';
import { alertService } from '../alertService';
import { mapService } from '../mapService';
import { routingService } from '../routing/routingService';

vi.mock('../copilotIntentService');
vi.mock('../facilityService');
vi.mock('../alertService');
vi.mock('../mapService');
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
    const graph = { nodes: new Map(), edges: [] } as any;
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'ROUTE_HANDOFF',
      destination: 'my seat'
    });
    vi.mocked(mapService.fetchRouteGraph).mockResolvedValue(graph);

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
    expect(mapService.fetchRouteGraph).toHaveBeenCalledWith('stadium-1');
    expect(routingService.computeRoute).toHaveBeenCalledWith(
      {
        source: { kind: 'ticket_seat' },
        destination: { kind: 'label', label: 'my seat' },
        mode: 'standard',
      },
      graph
    );
    expect(result.data).toBeDefined();
    expect((result.data as any).destinationLabel).toBe('my seat');
    expect((result.data as any).eta).toBe('4 mins');
    expect((result.data as any).distance).toBe('300m');
  });
  
  it('resolves ALERTS_STATUS to an alert_card', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'ALERTS_STATUS'
    });

    vi.mocked(alertService.fetchActiveAlerts).mockResolvedValue([
      { id: 'a1', title: 'Rain Delay', desc: 'Seek shelter' } as any
    ]);

    const result = await copilotResolver.processUserMessage('any alerts?', 'match-1', 'stadium-1');
    expect(result.type).toBe('alert_card');
    expect((result.data as any).issue).toBe('Rain Delay');
  });

  it('resolves TICKET_CONTEXT to a text message', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'TICKET_CONTEXT'
    });

    const result = await copilotResolver.processUserMessage('where am i sitting', 'match-1', 'stadium-1');
    expect(result.type).toBe('text');
    expect(result.content).toContain('Section 102');
  });

  it('resolves VENUE_FAQ to a text message', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'VENUE_FAQ',
      question: 'bag policy'
    });

    const result = await copilotResolver.processUserMessage('what is the bag policy', 'match-1', 'stadium-1');
    expect(result.type).toBe('text');
    // We don't strictly assert the exact FAQ answer since it comes from the lib, but we check type
  });

  it('resolves FACILITY_LOOKUP to text if none found', async () => {
    vi.mocked(copilotIntentService.extractIntent).mockResolvedValue({
      intent: 'FACILITY_LOOKUP',
      facility_type: 'magicshop'
    });
    vi.mocked(facilityService.fetchFacilities).mockResolvedValue([]);

    const result = await copilotResolver.processUserMessage('where is the magicshop', 'match-1', 'stadium-1');
    expect(result.type).toBe('text');
    expect(result.content).toContain('couldn\'t find');
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
