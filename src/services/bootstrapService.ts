import { supabase } from '@/services/supabase';
import type { Profile, Ticket } from '@/lib/types/domain';
import { requireAuthenticatedUser } from '@/lib/authGuards';

export const bootstrapService = {
  async loadAppBootstrapData(userId: string) {
    try {
      requireAuthenticatedUser();

      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found. Re-authentication required.');

      // Strict role enforcement during bootstrap
      if (profileData.role === 'fan') {
        // Fetch their most recent ticket
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*, matches(id, title, match_date, start_time, home_team, away_team, stadiums(name))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // Return clear markers for routing layer
        if (!ticketData) {
          return {
            profile: profileData as Profile,
            match: null,
            ticket: null
          };
        }

        let matchData = null;
        if (ticketData.matches) {
          const mData = Array.isArray(ticketData.matches) ? ticketData.matches[0] : ticketData.matches;
          if (mData) {
            const sData = mData.stadiums;
            const stadiumName = Array.isArray(sData) ? sData[0]?.name : sData?.name;
            matchData = { ...mData, title: mData.title || (stadiumName ? stadiumName + ' Match' : 'Match') };
            matchData.stadium_name = stadiumName;
          }
        }

        return {
          profile: profileData as Profile,
          match: matchData,
          ticket: ticketData as Ticket
        };
      } else if (profileData.role === 'ops_manager') {
        return {
          profile: profileData as Profile,
          match: null,
          ticket: null
        };
      } else {
         throw new Error(`Unsupported role: ${profileData.role}`);
      }
    } catch (error) {
      console.error('App bootstrap failed:', error);
      throw error; // Throw so caller handles it (e.g. redirecting) instead of silent failure
    }
  }
};
