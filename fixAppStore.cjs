const fs = require('fs');
const path = 'src/store/useAppStore.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('hasBootstrapped: boolean;')) {
  content = content.replace(
    'loadBootstrap: (userId: string, stadiumId: string) => Promise<void>;',
    'hasBootstrapped: boolean;\n  loadBootstrap: (userId: string) => Promise<void>;'
  );
  content = content.replace(
    'accessibleRouting: false,',
    'hasBootstrapped: false,\n  accessibleRouting: false,'
  );
  content = content.replace(
    'loadBootstrap: async (userId: string, stadiumId: string) => {',
    'loadBootstrap: async (userId: string) => {'
  );
  content = content.replace(
    'const data = await bootstrapService.loadAppBootstrapData(userId, stadiumId);',
    'const data = await bootstrapService.loadAppBootstrapData(userId);'
  );
  content = content.replace(
    'set({ profile: data.profile, match: data.match, ticket: data.ticket });',
    'set({ profile: data.profile, match: data.match, ticket: data.ticket, hasBootstrapped: true });'
  );
  content = content.replace(
    'logout: () => set({ profile: null, match: null, ticket: null, incidents: [] }),',
    'logout: () => set({ profile: null, match: null, ticket: null, incidents: [], hasBootstrapped: false }),'
  );
}

fs.writeFileSync(path, content);
console.log('useAppStore fixed');
