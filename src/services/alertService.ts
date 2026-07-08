import { supabase } from '@/services/supabase';
import type { Incident, AiRecommendation } from '@/lib/types/domain';

export type Alert = {
  id: string;
  title: string;
  desc: string;
  type: 'critical' | 'advisory' | 'resolved';
  created_at: string;
};

type FanSafeIncidentType =
  | 'crowd_disturbance'
  | 'accessibility_issue'
  | 'blocked_pathway'
  | 'general_help';

const FAN_SAFE_INCIDENT_TYPES: FanSafeIncidentType[] = [
  'crowd_disturbance',
  'accessibility_issue',
  'blocked_pathway',
  'general_help'
];

const isFanSafeIncident = (type: string): type is FanSafeIncidentType =>
  FAN_SAFE_INCIDENT_TYPES.includes(type as FanSafeIncidentType);

const buildIncidentAlert = (incident: Incident): Alert => ({
  id: incident.id,
  title: incident.title,
  desc: incident.ai_summary || incident.description,
  type: incident.status === 'resolved' ? 'resolved' : incident.severity === 'critical' ? 'critical' : 'advisory',
  created_at: incident.created_at,
});

const buildAdvisoryAlert = (advisory: AiRecommendation): Alert => ({
  id: advisory.id,
  title: advisory.title,
  desc: advisory.content,
  type: 'advisory',
  created_at: advisory.created_at,
});

export const alertService = {
  fetchActiveAlerts: async (matchId: string): Promise<Alert[]> => {
    const { data: incidentData, error: incidentError } = await supabase
      .from<Incident>('incidents')
      .select('*')
      .eq('match_id', matchId)
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false });

    if (incidentError) {
      console.error('Failed to fetch active alerts from incidents:', incidentError);
    }

    const { data: advisoryData, error: advisoryError } = await supabase
      .from<AiRecommendation>('ai_recommendations')
      .select('*')
      .eq('match_id', matchId)
      .eq('recommendation_type', 'public_advisory')
      .order('created_at', { ascending: false });

    if (advisoryError) {
      console.error('Failed to fetch active alerts from advisories:', advisoryError);
    }

    const incidents = incidentData ?? [];
    const advisories = advisoryData ?? [];

    const mergedAlerts: Alert[] = [
      ...incidents.filter((incident) => isFanSafeIncident(incident.incident_type)).map(buildIncidentAlert),
      ...advisories.map(buildAdvisoryAlert)
    ];

    return mergedAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};
