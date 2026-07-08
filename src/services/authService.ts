import { create } from 'zustand';
import { supabase } from './supabase';

type Role = 'fan' | 'ops_manager' | null;

interface AuthState {
  isInitialized: boolean;
  userId: string | null;
  role: Role;
  matchId: string | null;
  stadiumId: string | null;
  opsStadiumId: string | null;
  email: string | null;
  fullName: string | null;
  
  // App specific context actions
  setOpsMatchContext: (matchId: string | null) => void;
  setOpsStadiumContext: (stadiumId: string | null) => void;
  setFanTicketContext: () => void;
  
  // Supabase bridging
  initAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthService = create<AuthState>((set, get) => ({
  isInitialized: false,
  userId: null,
  role: null,
  matchId: null,
  stadiumId: null,
  opsStadiumId: null,
  email: null,
  fullName: null,

  setOpsMatchContext: (matchId) => set({ matchId }),
  setOpsStadiumContext: (opsStadiumId) => set({ opsStadiumId }),
  
  setFanTicketContext: () => {
    // Just trigger a re-render or signal we are ready.
    // The actual context comes from the tickets table and bootstrapService.
  },

  initAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        set({ isInitialized: true, userId: null, role: null, matchId: null, stadiumId: null, email: null, fullName: null });
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        set({ isInitialized: true, userId: null, role: null, matchId: null, stadiumId: null, email: null, fullName: null });
      }
    });

    async function fetchProfile(uid: string, email: string | undefined) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
      
      let profileData = data;

      // Fallback if trigger hasn't run yet
      if (!profileData && !error) {
        const { data: newProfile } = await supabase.from('profiles').insert([{
          id: uid,
          email: email || '',
          role: 'fan',
          full_name: email ? email.split('@')[0] : 'Fan'
        }]).select().maybeSingle();
        profileData = newProfile;
      }

      if (profileData) {
        set({
          isInitialized: true,
          userId: uid,
          role: profileData.role as Role,
          email: profileData.email || email || null,
          fullName: profileData.full_name || null
        });
        
        // If ops manager and no matchId, default to latest scheduled/live match
        if (profileData.role === 'ops_manager' && !get().matchId) {
          const { data: matches } = await supabase
            .from('matches')
            .select('id, stadium_id')
            .in('status', ['live', 'scheduled'])
            .order('start_time', { ascending: true })
            .limit(1);
            
          if (matches && matches.length > 0) {
            set({ matchId: matches[0].id, stadiumId: matches[0].stadium_id });
          }
        }
      } else {
        set({ isInitialized: true });
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      userId: null,
      role: null,
      matchId: null,
      stadiumId: null,
      opsStadiumId: null,
      email: null,
      fullName: null
    });
    // Clear legacy persisted auth from localStorage if it exists
    try { localStorage.removeItem('stadiaos-auth-storage'); } catch { /* ignore */ }
  }
}));
