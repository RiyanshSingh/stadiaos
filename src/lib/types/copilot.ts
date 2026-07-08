export type CopilotIntentType = 
  | 'FACILITY_LOOKUP'
  | 'ROUTE_HANDOFF'
  | 'INCIDENT_DRAFT'
  | 'ALERTS_STATUS'
  | 'TICKET_CONTEXT'
  | 'VENUE_FAQ'
  | 'UNKNOWN';

export interface CopilotIntent {
  intent: CopilotIntentType;
  facility_type?: string;
  destination?: string;
  incident_type?: string;
  description?: string;
  location?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  question?: string;
}

export type MessageType = 'text' | 'route_card' | 'facility_card' | 'incident_card' | 'alert_card';

export interface CopilotMessage {
  id: string;
  role: 'user' | 'copilot';
  type: MessageType;
  content: string;
  data?: any; // We can type these payloads strictly as requested
}

export interface RouteCardPayload {
  destinationType: 'seat' | 'gate' | 'amenity' | 'zone';
  destinationLabel: string;
  destinationId?: string;
  sourceContext: 'ticket' | 'query';
  eta: string;
  distance: string;
  routeMode: 'standard' | 'accessible';
}

export interface IncidentDraftPayload {
  incidentType: string;
  title: string;
  description: string;
  locationLabel: string;
  sectionHint?: string;
  zoneHint?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: true;
}

export interface FacilityCardPayload {
  name: string;
  wait: string;
  crowd: string;
}

export interface AlertCardPayload {
  issue: string;
  recommendation: string;
}
