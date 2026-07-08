import { supabase } from '@/services/supabase';
import type { Profile, Ticket, Match } from '@/lib/types/domain';
import { requireAuthenticatedUser } from '@/lib/authGuards';

type StadiumRow = { name?: string | null };

type MatchWithStadiums = Match & {
  stadiums?: StadiumRow | StadiumRow[] | null;
};

type TicketRow = Ticket & {
  matches?: MatchWithStadiums | MatchWithStadiums[] | null;
};

function normalizeMatchFromTicket(ticketData: TicketRow): Match | null {
  const matchRow = ticketData.matches;
  const candidate = Array.isArray(matchRow) ? matchRow[0] : matchRow;

  if (!candidate) {
    return null;
  }

  const stadiumName = Array.isArray(candidate.stadiums)
    ? candidate.stadiums[0]?.name
    : candidate.stadiums?.name;

  return {
    ...candidate,
    title: candidate.title || (stadiumName ? `${stadiumName} Match` : 'Match'),
    stadium_name: stadiumName
  };
}

export const bootstrapService = {
  async loadAppBootstrapData(userId: string): Promise<{ profile: Profile; ticket: TicketRow | null; match: Match | null }> {
    try {
      await requireAuthenticatedUser();

      const { data: profileData, error: profileError } = await supabase
        .from<Profile>('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found. Re-authentication required.');

      if (profileData.role === 'fan') {
        const { data: ticketData, error: ticketError } = await supabase
          .from<TicketRow>('tickets')
          .select('*, matches(id, title, match_date, start_time, home_team, away_team, stadiums(name))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ticketError) throw ticketError;
        if (!ticketData) {
          return {
            profile: profileData,
            match: null,
            ticket: null
          };
        }

        return {
          profile: profileData,
          match: normalizeMatchFromTicket(ticketData),
          ticket: ticketData
        };
      }

      if (profileData.role === 'ops_manager') {
        return {
          profile: profileData,
          match: null,
          ticket: null
        };
      }

      throw new Error(`Unsupported role: ${profileData.role}`);
    } catch (error) {
      console.error('App bootstrap failed:', error);
      throw error;
    }
  }
};
