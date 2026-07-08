import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import { triageService } from '@/services/triageService';
import { requireOpsSession, requireFanSession } from '@/lib/authGuards';
import type { Incident, IncidentStatus, IncidentUpdate } from '@/lib/types/domain';

type IncidentReportPayload = {
  type: string;
  zone: string;
  description: string;
};

const ALLOWED_INCIDENT_TYPES = new Set([
  'medical',
  'security',
  'lost_person',
  'accessibility',
  'maintenance',
  'crowd',
  'suspicious_item',
  'other'
]);

const sanitizeIncidentPayload = (payload: IncidentReportPayload): IncidentReportPayload => ({
  type: ALLOWED_INCIDENT_TYPES.has(payload.type) ? payload.type : 'other',
  zone: payload.zone.trim().slice(0, 200),
  description: payload.description.trim().slice(0, 2000)
});

type IncidentWithUpdates = Incident & {
  updates?: IncidentUpdate[] | null;
};

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
  reportIncident: (incidentData: IncidentReportPayload, matchId: string, stadiumId: string) => Promise<void>;
}

export const useIncidentService = create<IncidentState>((set, get) => ({
  incidents: [],
  myIncidents: [],

  // --- OPS METHODS ---
  fetchIncidents: async (matchId) => {
    await requireOpsSession();

    const { data, error } = await supabase
      .from<Incident>('incidents')
      .select('*')
      .eq('match_id', matchId)
      .neq('status', 'resolved')
      .neq('status', 'closed')
      .order('created_at', { ascending: false });

    if (data && !error) {
      set({ incidents: data });
    }
  },

  resolveIncident: async (id) => {
    const sessionUserId = await requireOpsSession();

    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: 'resolved' as IncidentStatus } : inc
      )
    }));

    await supabase.from<Incident>('incidents').update({ status: 'resolved' }).eq('id', id);
    await supabase.from<IncidentUpdate>('incident_updates').insert([
      {
        incident_id: id,
        new_status: 'resolved',
        note: 'Incident resolved by operations.',
        updated_by: sessionUserId
      }
    ]);
  },

  updateIncidentStatus: async (id, oldStatus, newStatus, note) => {
    const sessionUserId = await requireOpsSession();

    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, status: newStatus } : inc
      )
    }));

    await supabase.from<Incident>('incidents').update({ status: newStatus }).eq('id', id);
    await supabase.from<IncidentUpdate>('incident_updates').insert([
      {
        incident_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        note: note || `Status changed to ${newStatus}`,
        updated_by: sessionUserId
      }
    ]);
  },

  assignIncidentTeam: async (id, team) => {
    const sessionUserId = await requireOpsSession();

    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === id ? { ...inc, assigned_team: team } : inc
      )
    }));

    await supabase.from<Incident>('incidents').update({ assigned_team: team }).eq('id', id);
    await supabase.from<IncidentUpdate>('incident_updates').insert([
      {
        incident_id: id,
        note: `Assigned to team: ${team}`,
        updated_by: sessionUserId
      }
    ]);
  },

  addIncidentNote: async (id, note) => {
    const sessionUserId = await requireOpsSession();

    const { error } = await supabase.from<IncidentUpdate>('incident_updates').insert([
      {
        incident_id: id,
        note,
        updated_by: sessionUserId
      }
    ]);

    if (error) {
      console.error('Failed to add incident note:', error);
    }
  },

  subscribeToIncidents: (matchId) => {
    const channelName = `ops_incidents_${matchId}`;
    const channel = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);

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
    await requireFanSession();

    const { data, error } = await supabase
      .from<IncidentWithUpdates>('incidents')
      .select('*, updates:incident_updates(*)')
      .eq('reported_by', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const parsedData = data.map((inc) => ({
        ...inc,
        updates: inc.updates
          ? [...inc.updates].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          : []
      }));

      set({ myIncidents: parsedData as Incident[] });
    } else if (error) {
      console.error('Failed to fetch my incidents:', error);
    }
  },

  subscribeToMyIncidents: (userId) => {
    const channelName = `fan_incidents_${userId}`;
    const channel = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);

    if (!channel) {
      supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents', filter: `reported_by=eq.${userId}` }, () => {
          get().fetchMyIncidents(userId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'incident_updates' }, () => {
          get().fetchMyIncidents(userId);
        })
        .subscribe();
    }
  },

  reportIncident: async (incidentData, matchId, stadiumId) => {
    const sanitized = sanitizeIncidentPayload(incidentData);

    if (!matchId || !stadiumId) {
      throw new Error('Invalid incident context.');
    }

    try {
      const sessionUserId = await requireFanSession();
      const triage = await triageService.analyzeIncident(sanitized);

      const insertPayload = {
        match_id: matchId,
        stadium_id: stadiumId,
        reported_by: sessionUserId,
        reporter_role: 'fan',
        title: sanitized.type,
        description: `Location: ${sanitized.zone} | ${sanitized.description}`,
        incident_type: sanitized.type,
        severity: triage.severity,
        status: 'reported',
        ai_summary: triage.summary
      };

      const { data: newIncident, error } = await supabase
        .from<Incident>('incidents')
        .insert([insertPayload])
        .select()
        .single();

      if (error || !newIncident) {
        console.error('Failed to report incident', error);
        throw error || new Error('Incident report failed.');
      }

      const { error: updateError } = await supabase.from<IncidentUpdate>('incident_updates').insert([
        {
          incident_id: newIncident.id,
          new_status: 'reported',
          note: 'Report submitted by user.',
          updated_by: sessionUserId
        }
      ]);

      if (updateError) {
        console.error('Failed to insert incident update:', updateError);
      }

      return newIncident;
    } catch (e) {
      console.error('Failed to report incident', e);
      throw e;
    }
  }
}));
