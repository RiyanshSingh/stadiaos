import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { triageService } from '@/services/triageService';
import { useAuthService } from '@/services/authService';
import type { Incident, IncidentSeverity, IncidentStatus } from '@/lib/types/domain';

interface IncidentState {
  incidents: Incident[]; // For ops dashboard
  myIncidents: Incident[]; // For fan dashboard
  
  // Ops Methods
  fetchIncidents: (matchId: string) => Promise<void>;
  resolveIncident: (id: string) => Promise<void>;
  updateIncidentStatus: (id: string, oldStatus: IncidentStatus, newStatus: IncidentStatus, note?: string) => Promise<void>;
  assignIncidentTeam: (id: string, team: string) => Promise<void>;
  addIncidentNote: (id: string, note: string) => Promise<void>;
  subscribeToIncidents: (matchId: string) => void;
  
  // Fan Methods
  fetchMyIncidents: (userId: string) => Promise<void>;
  subscribeToMyIncidents: (userId: string) => void;
  reportIncident: (incidentData: any, matchId: string, stadiumId: string, reporterId: string, role: string) => Promise<void>;
}

export const useIncidentService = create<IncidentState>((set, get) => ({
  incidents: [],
  myIncidents: [],

  // --- OPS METHODS ---
  fetchIncidents: async (matchId) => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('match_id', matchId)
      .neq('status', 'resolved')
      .neq('status', 'closed')
      .order('created_at', { ascending: false });
    
    if (data && !error) {
      set({ incidents: data as Incident[] });
    }
  },
  
  resolveIncident: async (id) => {
    // Optimistic update
    set((state) => ({
      incidents: state.incidents.map(inc => inc.id === id ? { ...inc, status: 'resolved' as IncidentStatus } : inc)
    }));
    const sessionUserId = useAuthService.getState().userId;
    await supabase.from('incidents').update({ status: 'resolved' }).eq('id', id);
    await supabase.from('incident_updates').insert([{
      incident_id: id,
      new_status: 'resolved',
      note: 'Incident resolved by operations.',
      updated_by: sessionUserId
    }]);
  },

  updateIncidentStatus: async (id, oldStatus, newStatus, note) => {
    set((state) => ({
      incidents: state.incidents.map(inc => inc.id === id ? { ...inc, status: newStatus } : inc)
    }));
    const sessionUserId = useAuthService.getState().userId;
    await supabase.from('incidents').update({ status: newStatus }).eq('id', id);
    await supabase.from('incident_updates').insert([{
      incident_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      note: note || `Status changed to ${newStatus}`,
      updated_by: sessionUserId
    }]);
  },

  assignIncidentTeam: async (id, team) => {
    set((state) => ({
      incidents: state.incidents.map(inc => inc.id === id ? { ...inc, assigned_team: team as any } : inc)
    }));
    const sessionUserId = useAuthService.getState().userId;
    await supabase.from('incidents').update({ assigned_team: team }).eq('id', id);
    await supabase.from('incident_updates').insert([{
      incident_id: id,
      note: `Assigned to team: ${team}`,
      updated_by: sessionUserId
    }]);
  },

  addIncidentNote: async (id, note) => {
    const sessionUserId = useAuthService.getState().userId;
    await supabase.from('incident_updates').insert([{
      incident_id: id,
      note: note,
      updated_by: sessionUserId
    }]);
    // Optionally fetch to reflect in UI if we track notes in the ops list
  },
  
  subscribeToIncidents: (matchId) => {
    const channelName = `ops_incidents_${matchId}`;
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (!channel) {
      supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents', filter: `match_id=eq.${matchId}` }, () => {
          get().fetchIncidents(matchId);
        })
        .subscribe();
    }
  },

  // --- FAN METHODS ---
  fetchMyIncidents: async (userId) => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, updates:incident_updates(*)')
      .eq('reported_by', userId)
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      // Sort updates inside each incident descending by time
      const parsedData = data.map(inc => ({
        ...inc,
        updates: inc.updates ? inc.updates.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : []
      }));
      set({ myIncidents: parsedData as Incident[] });
    } else if (error) {
      console.error('Failed to fetch my incidents:', error);
    }
  },

  subscribeToMyIncidents: (userId) => {
    const channelName = `fan_incidents_${userId}`;
    let channel = supabase.getChannels().find(c => c.topic === `realtime:${channelName}`);
    if (!channel) {
      supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents', filter: `reported_by=eq.${userId}` }, () => {
          get().fetchMyIncidents(userId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_updates' }, () => {
          // A bit broad, but ensures we get the update if it belongs to one of our incidents
          get().fetchMyIncidents(userId);
        })
        .subscribe();
    }
  },

  reportIncident: async (incidentData, matchId, stadiumId, reporterId, role) => {
    try {
      // 1. Triage using AI
      const triage = await triageService.analyzeIncident(incidentData);
      
      // 2. Insert into DB
      const { data: newIncident, error } = await supabase.from('incidents').insert([{
        match_id: matchId,
        stadium_id: stadiumId,
        reported_by: reporterId,
        reporter_role: role,
        title: incidentData.type,
        description: `Location: ${incidentData.zone} | ${incidentData.description}`,
        incident_type: 'general_help', // Simplification for MVP
        severity: triage.severity,
        status: 'reported',
        ai_summary: triage.summary
      }]).select().single();
      
      if (error) {
        console.error('Failed to report incident', error);
        return;
      }
      
      // 3. Insert initial update note
      if (newIncident) {
        await supabase.from('incident_updates').insert([{
          incident_id: newIncident.id,
          new_status: 'reported',
          note: 'Report submitted by user.',
        }]);
      }
    } catch (e) {
      console.error(e);
    }
  },
}));
