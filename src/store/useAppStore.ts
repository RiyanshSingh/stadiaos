import { create } from 'zustand'
import type { Profile, Match, Ticket } from '@/lib/types/domain'
import { bootstrapService } from '@/services/bootstrapService'
import { supabase } from '@/services/supabase'

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

interface AppState {
  messages: Message[];
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  isTyping: boolean;
  incidents: Incident[];
  reportIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'status'>) => void;
  resolveIncident: (id: string) => void;
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
      const matchId = state.match?.id || null;
      const stadiumId = state.match?.stadium_id || null;
      const userId = state.profile?.id || null;
      
      const { triageService } = await import('@/services/triageService');
      const triage = await triageService.analyzeIncident({
        type: incident.type,
        zone: incident.zone,
        description: incident.description
      });

      const newIncident: Incident = {
        ...incident,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        status: 'reported',
        aiSummary: triage.summary,
        aiAction: triage.action,
        severity: triage.severity as any || incident.severity || 'medium'
      };
      
      // Update local state immediately for fast feedback
      set((state) => ({ incidents: [newIncident, ...state.incidents] }));

      // Insert into Supabase with context
      const { error } = await supabase
        .from('incidents')
        .insert([{
           title: incident.type,
           incident_type: incident.type,
           description: `Location: ${incident.zone} | ${incident.description}`,
           severity: triage.severity || incident.severity || 'medium',
           status: 'reported',
           ai_summary: triage.summary,
           zone_id: null, // Note: ideally we'd map zone string to zone_id
           match_id: matchId,
           stadium_id: stadiumId,
           reported_by: userId,
           reporter_role: 'fan'
        }]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    } catch (error) {
       console.error("Supabase Error:", error);
    }
  },
  resolveIncident: async (id) => {
    // Optimistic update
    set((state) => ({
      incidents: state.incidents.map(inc => inc.id === id ? { ...inc, status: 'resolved' } : inc)
    }))
    try {
      await supabase.from('incidents').update({ status: 'resolved' }).eq('id', id);
    } catch (error) {
      console.error(error);
    }
  },
  initSupabase: async () => {
    try {
      // Fetch existing unresolved incidents
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .neq('status', 'resolved')
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        const dbIncidents: Incident[] = data.map((d: any) => ({
          id: d.id,
          type: d.incident_type,
          reporterId: d.reported_by,
          description: d.description || '',
          severity: d.severity,
          status: d.status,
          zone: d.description?.split('|')[0]?.replace('Location: ', '')?.trim() || 'Unknown',
          timestamp: new Date(d.created_at),
          aiSummary: d.ai_summary,
          aiAction: d.ai_recommended_actions?.action,
        }));
        set({ incidents: dbIncidents });
      }

      // Subscribe to real-time changes on incidents safely
      let channel = supabase.getChannels().find(c => c.topic === 'realtime:appstore_incidents_channel');
      if (!channel) {
        supabase
          .channel('appstore_incidents_channel')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
            // For simplicity, just refetch all active incidents on any change
            supabase
              .from('incidents')
              .select('*')
              .neq('status', 'resolved')
              .order('created_at', { ascending: false })
              .then(({ data }) => {
                if (data) {
                  const refreshedIncidents: Incident[] = data.map((d: any) => ({
                    id: d.id,
                    type: d.incident_type,
                    reporterId: d.reported_by,
                    description: d.description || '',
                    severity: d.severity,
                    status: d.status,
                    zone: d.description?.split('|')[0]?.replace('Location: ', '')?.trim() || 'Unknown',
                    timestamp: new Date(d.created_at),
                    aiSummary: d.ai_summary,
                    aiAction: d.ai_recommended_actions?.action,
                  }));
                  set({ incidents: refreshedIncidents });
                }
              });
          })
          .subscribe();
      }
    } catch (error) {
      console.error("Failed to init Supabase", error);
    }
  }
}))
