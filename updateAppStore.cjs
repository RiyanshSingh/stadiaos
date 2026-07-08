const fs = require('fs');

const path = 'src/store/useAppStore.ts';
let content = fs.readFileSync(path, 'utf8');

// Add logout to AppState interface
content = content.replace(
  /loadBootstrap: \(userId: string, stadiumId: string\) => Promise<void>;/,
  'loadBootstrap: (userId: string, stadiumId: string) => Promise<void>;\n  logout: () => void;'
);

// Implement logout in the store
content = content.replace(
  /toggleAccessibleRouting: \(\) => set\(\(state\) => \(\{ accessibleRouting: !state.accessibleRouting \}\)\),/,
  'toggleAccessibleRouting: () => set((state) => ({ accessibleRouting: !state.accessibleRouting })),\n  logout: () => set({ profile: null, match: null, ticket: null, incidents: [] }),'
);

// In loadBootstrap, if no data is found, we should probably clear it or keep it null.
fs.writeFileSync(path, content);
console.log('useAppStore updated with logout');
