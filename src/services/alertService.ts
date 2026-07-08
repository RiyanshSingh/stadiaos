import { supabase } from '@/services/supabase';
import type { Incident } from '@/lib/types/domain';

export type Alert = {
  id: string;
  title: string;
  desc: string;
  type: 'critical' | 'advisory' | 'resolved';
  created_at: string;
};

// Only these incident types are safe to broadcast publicly to fans.
// Medical, harassment, suspicious_item, lost_child are staff-only / sensitive.
const FAN_SAFE_INCIDENT_TYPES = [
  'crowd_disturbance',
  'accessibility_issue',
  'blocked_pathway',
  'general_help'
];

export const alertService = {
  fetchActiveAlerts: async (matchId: string): Promise<Alert[]> => {
    // Fetch fan-safe high/critical incidents
    const { data: incidentData, error: incidentError } = await supabase
      .from('incidents')
      .select('*')
      .eq('match_id', matchId)
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false });

    if (incidentError) {
      console.error('Failed to fetch active alerts from incidents:', incidentError);
    }

    // Fetch ops-authored public advisories
    const { data: advisoryData, error: advisoryError } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('match_id', matchId)
      .eq('recommendation_type', 'public_advisory')
      .order('created_at', { ascending: false });

    if (advisoryError) {
      console.error('Failed to fetch active alerts from advisories:', advisoryError);
    }

    const incidents = (incidentData || []) as Incident[];
    
    // Apply fan-safe derivation rule
    const publicIncidents = incidents.filter(inc => 
      FAN_SAFE_INCIDENT_TYPES.includes(inc.incident_type)
    );

    const mergedAlerts: Alert[] = [];

    // Map public incidents to Alert format
    publicIncidents.forEach(incident => {
      mergedAlerts.push({
        id: incident.id,
        title: incident.title,
        desc: incident.ai_summary || incident.description,
        type: incident.status === 'resolved' ? 'resolved' : incident.severity === 'critical' ? 'critical' : 'advisory',
        created_at: incident.created_at,
      });
    });

    // Map advisories to Alert format
    if (advisoryData) {
      advisoryData.forEach((adv: any) => {
        mergedAlerts.push({
          id: adv.id,
          title: adv.title,
          desc: adv.content,
          type: 'advisory', // Ops advisories are displayed as advisories
          created_at: adv.created_at,
        });
      });
    }

    // Sort combined alerts by created_at descending
    return mergedAlerts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};
