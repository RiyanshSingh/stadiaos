import { copilotIntentService } from './copilotIntentService';
import { facilityService } from './facilityService';
import { alertService } from './alertService';
import { getVenueFaqAnswer } from '../lib/constants/venueFaq';
import { useAppStore } from '../store/useAppStore';
import type { 
  CopilotMessage, 
  FacilityCardPayload, 
  RouteCardPayload, 
  IncidentDraftPayload, 
  AlertCardPayload 
} from '../lib/types/copilot';

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * The Copilot Resolver acts as the orchestrator for all AI interactions.
 * It takes structured intents (from the Groq LLM) and maps them to concrete
 * backend service actions, returning UI-renderable "Action Cards".
 */
export const copilotResolver = {
  /**
   * Processes a natural language fan message, maps it to an intent, and resolves it against venue data.
   * 
   * @param {string} userMessage - The raw query from the fan.
   * @param {string} matchId - The active match context.
   * @param {string} stadiumId - The active stadium context.
   * @returns {Promise<CopilotMessage>} A structured message payload to be rendered in the chat UI.
   */
  processUserMessage: async (userMessage: string, matchId: string, stadiumId: string): Promise<CopilotMessage> => {
    // 1. Get structured intent from Groq
    const intentPayload = await copilotIntentService.extractIntent(userMessage);

    // 2. Resolve intent to CopilotMessage using domain services
    switch (intentPayload.intent) {
      
      case 'FACILITY_LOOKUP': {
        const type = intentPayload.facility_type?.toLowerCase() || 'washroom';
        const facilities = await facilityService.fetchFacilities(stadiumId, matchId);
        // Find a matching facility
        const found = facilities.find(f => f.type === type || f.name.toLowerCase().includes(type));
        
        if (found) {
          const payload: FacilityCardPayload = {
            name: found.name,
            wait: found.wait || 'Unknown',
            crowd: found.crowd || 'Unknown'
          };
          return {
            id: generateId(),
            role: 'copilot',
            type: 'facility_card',
            content: `I found a ${type} nearby.`,
            data: payload
          };
        }
        
        return {
          id: generateId(),
          role: 'copilot',
          type: 'text',
          content: `I couldn't find a nearby ${type} right now.`
        };
      }

      case 'ROUTE_HANDOFF': {
        const destination = intentPayload.destination?.trim() || 'your destination';
        const routeMode: 'standard' | 'accessible' =
          /accessible|wheelchair/.test(userMessage.toLowerCase()) ? 'accessible' : 'standard';

        try {
          const { mapService } = await import('./mapService');
          const { routingService } = await import('./routing/routingService');
          const { ticket } = useAppStore.getState();

          const graph = await mapService.fetchRouteGraph(stadiumId);
          const outcome = await routingService.computeRoute(
            {
              source: ticket ? { kind: 'ticket_seat' } : { kind: 'label', label: 'north_concourse' },
              destination: { kind: 'label', label: destination },
              mode: routeMode
            },
            graph
          );

          const destinationType: RouteCardPayload['destinationType'] =
            destination.includes('gate')
              ? 'gate'
              : destination.includes('seat') || destination.includes('section')
              ? 'seat'
              : destination.includes('washroom') || destination.includes('food') || destination.includes('medical')
              ? 'amenity'
              : 'zone';

          const payload: RouteCardPayload = {
            destinationType,
            destinationLabel: destination,
            destinationId: undefined,
            sourceContext: ticket ? 'ticket' : 'query',
            eta: outcome.ok ? `${outcome.etaMinutes} mins` : '~5 mins',
            distance: outcome.ok ? `${outcome.distanceMeters}m` : '~320m',
            routeMode
          };

          return {
            id: generateId(),
            role: 'copilot',
            type: 'route_card',
            content: `Here is the route to ${destination}:`,
            data: payload
          };
        } catch (error) {
          console.error('Route handoff failed:', error);
          return {
            id: generateId(),
            role: 'copilot',
            type: 'text',
            content: `I couldn't compute a route to ${destination} right now. Please try again in a moment.`
          };
        }
      }

      case 'INCIDENT_DRAFT': {
        const payload: IncidentDraftPayload = {
          incidentType: intentPayload.incident_type || 'general_help',
          title: intentPayload.description ? intentPayload.description.slice(0, 30) : 'New Incident',
          description: intentPayload.description || userMessage,
          locationLabel: intentPayload.location || 'Unknown Location',
          severity: intentPayload.severity || 'medium',
          requiresConfirmation: true
        };
        
        return {
          id: generateId(),
          role: 'copilot',
          type: 'incident_card',
          content: 'I have drafted an incident report. Please review and confirm to notify staff:',
          data: payload
        };
      }

      case 'ALERTS_STATUS': {
        const alerts = await alertService.fetchActiveAlerts(matchId);
        if (alerts.length > 0) {
          const alert = alerts[0]; // just show top alert for now
          const payload: AlertCardPayload = {
            issue: alert.title,
            recommendation: alert.desc
          };
          return {
            id: generateId(),
            role: 'copilot',
            type: 'alert_card',
            content: 'There is currently an active advisory:',
            data: payload
          };
        }
        
        return {
          id: generateId(),
          role: 'copilot',
          type: 'text',
          content: 'There are no active alerts at the moment. Enjoy the event!'
        };
      }

      case 'TICKET_CONTEXT': {
        const { ticket } = useAppStore.getState();
        if (ticket) {
          return {
            id: generateId(),
            role: 'copilot',
            type: 'text',
            content: `You are sitting in Section ${ticket.seat_section}, Row ${ticket.seat_row}, Seat ${ticket.seat_number}.`
          };
        }
        return {
          id: generateId(),
          role: 'copilot',
          type: 'text',
          content: 'I don\'t see any active ticket linked to your profile right now.'
        };
      }

      case 'VENUE_FAQ': {
        const answer = getVenueFaqAnswer(intentPayload.question || userMessage);
        return {
          id: generateId(),
          role: 'copilot',
          type: 'text',
          content: answer
        };
      }

      case 'UNKNOWN':
      default: {
        return {
          id: generateId(),
          role: 'copilot',
          type: 'text',
          content: 'I am the StadiaOS Copilot. I can help you find facilities (like the nearest washroom or food), guide you to your seat, report incidents, or answer venue policy questions. How can I assist you?'
        };
      }
    }
  }
};
