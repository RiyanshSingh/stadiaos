import { create } from 'zustand';
import { supabase } from './supabase';
import { useAppStore } from '@/store/useAppStore';
import type { Profile, Match } from '@/lib/types/domain';

type Role = Profile['role'] | null;

type SupabaseUserSession = {
  user?: {
    id?: string;
    email?: string | null;
  };
} | null;

interface AuthState {
  isInitialized: boolean;
  userId: string | null;
  role: Role;
  matchId: string | null;
  stadiumId: string | null;
  opsStadiumId: string | null;
  email: string | null;
  fullName: string | null;

  setOpsMatchContext: (matchId: string | null) => void;
  setOpsStadiumContext: (stadiumId: string | null) => void;
  setFanTicketContext: () => void;

  initAuth: () => Promise<void>;
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

  initAuth: async (): Promise<void> => {
    const resetAuthState = () => {
      set({
        isInitialized: true,
        userId: null,
        role: null,
        matchId: null,
        stadiumId: null,
        opsStadiumId: null,
        email: null,
        fullName: null
      });
    };

    const fetchProfile = async (uid: string, email?: string | null) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      let profileData = data;

      if (!profileData && !error) {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([
            {
              id: uid,
              email: email || '',
              role: 'fan',
              full_name: email ? email.split('@')[0] : 'Fan'
            }
          ])
          .select()
          .maybeSingle();

        profileData = newProfile;
      }

      if (!profileData || error) {
        resetAuthState();
        return;
      }

      set({
        isInitialized: true,
        userId: uid,
        role: profileData.role,
        email: profileData.email || email || null,
        fullName: profileData.full_name || null
      });

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
    };

    const authStateHandler = async (_event: string, session: SupabaseUserSession) => {
      if (session?.user?.id) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        resetAuthState();
      }
    };

    supabase.auth.onAuthStateChange(authStateHandler);

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user?.id) {
      await fetchProfile(session.user.id, session.user.email);
    } else {
      resetAuthState();
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    useAppStore.getState().logout();
    set({
      userId: null,
      role: null,
      matchId: null,
      stadiumId: null,
      opsStadiumId: null,
      email: null,
      fullName: null
    });
    try {
      localStorage.removeItem('stadiaos-auth-storage');
    } catch {
      // ignore browser storage cleanup failures
    }
  }
}));
