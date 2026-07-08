import { create } from 'zustand'
import type { Profile, Match, Ticket } from '@/lib/types/domain'
import { bootstrapService } from '@/services/bootstrapService'
import { supabase } from '@/services/supabase'
import { triageService } from '@/services/triageService'

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type Incident = {
  id: string;
  type: string;
  reporterId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'reported' | 'assigned' | 'resolved';
  zone: string;
  timestamp: Date;
  aiSummary?: string;
  aiAction?: string;
}

const normalizeIncidentRow = (row: any): Incident => ({
  id: row.id,
  type: row.incident_type,
  reporterId: row.reported_by,
  description: row.description || '',
  severity: row.severity || 'medium',
  status: row.status,
  zone: row.description?.split('|')[0]?.replace('Location: ', '')?.trim() || 'Unknown',
  timestamp: new Date(row.created_at),
  aiSummary: row.ai_summary,
  aiAction: row.ai_recommended_actions?.action,
});

const fetchActiveIncidents = async (): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .neq('status', 'resolved')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Failed to load active incidents', error);
    return [];
  }

  return data.map(normalizeIncidentRow);
};

interface AppState {
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  isTyping: boolean;
  incidents: Incident[];
  reportIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  resolveIncident: (id: string) => Promise<void>;
  initSupabase: () => Promise<void>;
  
  // Bootstrap data
  profile: Profile | null;
  match: Match | null;
  ticket: Ticket | null;
  hasBootstrapped: boolean;
  loadBootstrap: (userId: string) => Promise<void>;
  logout: () => void;
  // Preferences
  accessibleRouting: boolean;
  toggleAccessibleRouting: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hi Jacob! I am your StadiaOS Copilot. I can help you find your seat, locate the nearest amenities with the shortest lines, or assist with any emergencies. How can I help you today?',
      timestamp: new Date(),
    }
  ],
  isTyping: false,
  incidents: [],
  profile: null,
  match: null,
  ticket: null,
  hasBootstrapped: false,
  accessibleRouting: false,
  toggleAccessibleRouting: () => set((state) => ({ accessibleRouting: !state.accessibleRouting })),
  logout: () => set({ profile: null, match: null, ticket: null, incidents: [], hasBootstrapped: false }),
  loadBootstrap: async (userId: string) => {
    const data = await bootstrapService.loadAppBootstrapData(userId);
    if (data) {
      set({ profile: data.profile, match: data.match, ticket: data.ticket, hasBootstrapped: true });
    }
  },
  // Messages moved to local component state in FanCopilot
  addMessage: () => {},
  
  reportIncident: async (incident) => {
    try {
      const state = get();
      const matchId = state.match?.id;
      const stadiumId = state.match?.stadium_id;
      const userId = state.profile?.id;

      if (!matchId || !stadiumId || !userId) {
        console.error('Missing app context for incident report.');
        return;
      }

      const triage = await triageService.analyzeIncident({
        type: incident.type,
        zone: incident.zone,
        description: incident.description
      });

      const severity = triage.severity || incident.severity || 'medium';
      const newIncident: Incident = {
        ...incident,
        id: Math.random().toString(36).slice(2, 11),
        timestamp: new Date(),
        status: 'reported',
        aiSummary: triage.summary,
        aiAction: triage.action,
        severity
      };

      set((state) => ({ incidents: [newIncident, ...state.incidents] }));

      const { error } = await supabase
        .from('incidents')
        .insert([
          {
            title: incident.type,
            incident_type: incident.type,
            description: `Location: ${incident.zone} | ${incident.description}`,
            severity,
            status: 'reported',
            ai_summary: triage.summary,
            zone_id: null,
            match_id: matchId,
            stadium_id: stadiumId,
            reported_by: userId,
            reporter_role: 'fan'
          }
        ]);

      if (error) {
        console.error('Supabase insert error:', error);
      }
    } catch (error) {
      console.error('Supabase Error:', error);
    }
  },
  resolveIncident: async (id) => {
    if (!id) {
      return;
    }

    set((state) => ({
      incidents: state.incidents.map((inc) => (inc.id === id ? { ...inc, status: 'resolved' } : inc))
    }));

    try {
      await supabase.from('incidents').update({ status: 'resolved' }).eq('id', id);
    } catch (error) {
      console.error(error);
    }
  },
  initSupabase: async () => {
    try {
      const dbIncidents = await fetchActiveIncidents();
      set({ incidents: dbIncidents });

      const channelExists = supabase.getChannels().some((c: any) => c.topic === 'realtime:appstore_incidents_channel');
      if (!channelExists) {
        supabase
          .channel('appstore_incidents_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, async () => {
            const refreshedIncidents = await fetchActiveIncidents();
            set({ incidents: refreshedIncidents });
          })
          .subscribe();
      }
    } catch (error) {
      console.error('Failed to init Supabase', error);
    }
  }
}))
