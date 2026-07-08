const fs = require('fs');

const content = `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'fan' | 'ops_manager';

interface AuthState {
  userId: string | null;
  role: Role | null;
  matchId: string | null; // For Ops context primarily, but could be useful globally
  stadiumId: string | null;
  loginFan: (userId: string) => void;
  loginOps: (userId: string, initialMatchId: string, initialStadiumId: string) => void;
  setOpsMatchContext: (matchId: string) => void;
  logout: () => void;
}

export const useAuthService = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      matchId: null,
      stadiumId: null,
      
      loginFan: (userId) => set({
        userId,
        role: 'fan',
        // Fan match/stadium context is hydrated into useAppStore dynamically
        matchId: null,
        stadiumId: null
      }),

      loginOps: (userId, initialMatchId, initialStadiumId) => set({
        userId,
        role: 'ops_manager',
        matchId: initialMatchId,
        stadiumId: initialStadiumId
      }),

      setOpsMatchContext: (matchId) => set({ matchId }),

      logout: () => set({
        userId: null,
        role: null,
        matchId: null,
        stadiumId: null
      })
    }),
    {
      name: 'stadiaos-auth-storage',
    }
  )
);
`;

fs.writeFileSync('src/services/authService.ts', content);
console.log('authService updated');
