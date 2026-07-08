import { supabase } from '@/services/supabase';
import type { Profile, Match, Ticket } from '@/lib/types/domain';

export const bootstrapService = {
  async loadAppBootstrapData(userId: string) {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) throw profileError;

      // It's possible the profile is null if they just signed up and the trigger failed,
      // but authService should handle fallback creation. Let's proceed if it exists.
      if (profileData && profileData.role === 'fan') {
        // Fetch their most recent ticket
        const { data: ticketData } = await supabase
          .from('tickets')
          .select('*, matches(id, title, match_date, start_time, home_team, away_team, stadiums(name))')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        let matchData = null;
        if (ticketData) {
           const { data: mData } = await supabase.from('matches').select('*').eq('id', ticketData.match_id).single();
           if (mData) {
             const { data: sData } = await supabase.from('stadiums').select('name').eq('id', mData.stadium_id).single();
             matchData = { ...mData, title: mData.title || (sData ? sData.name + ' Match' : 'Match') };
             matchData.stadium_name = sData?.name;
           }
        }

        return {
          profile: profileData as Profile,
          match: matchData,
          ticket: ticketData as Ticket | null
        };
      } else {
        return {
          profile: profileData as Profile,
          match: null,
          ticket: null
        };
      }

    } catch (error) {
      console.error('App bootstrap failed:', error);
      return null;
    }
  }
};
