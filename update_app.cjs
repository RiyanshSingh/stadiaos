const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  "import { FanAccessView } from '@/app/auth/FanAccessView'\nimport { OpsAccessView } from '@/app/auth/OpsAccessView'",
  "import { AuthView } from '@/app/auth/AuthView'\nimport { TicketSetupView } from '@/app/fan/TicketSetupView'"
);

// Update ProtectedFanRoute logic to handle missing ticket redirect to ticket-setup
// Wait, we can't reliably do this purely inside ProtectedFanRoute if it relies on async store loading.
// Instead we let App.tsx load Bootstrap, and FanDashboard can redirect, OR ProtectedFanRoute checks the store.
// Let's modify the route configurations:
const routeConfig = `
function ProtectedFanRoute() {
  const { userId, role } = useAuthService();
  if (!userId || role !== 'fan') {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

function ProtectedOpsRoute() {
  const { userId, role } = useAuthService();
  if (!userId || role !== 'ops_manager') {
    return <Navigate to="/auth" state={{ from: { pathname: '/ops' } }} replace />;
  }
  return <Outlet />;
}
`;

content = content.replace(/function ProtectedFanRoute\(\) \{[\s\S]*?return <Outlet \/>;\n\}/, routeConfig);

// Update Routes
content = content.replace(
  /<Route path="\/access" element=\{<FanAccessView \/>\} \/>\n\s*<Route path="\/ops\/access" element=\{<OpsAccessView \/>\} \/>/,
  `<Route path="/auth" element={<AuthView />} />\n        <Route path="/ticket-setup" element={<ProtectedFanRoute><PageWrapper><TicketSetupView /></PageWrapper></ProtectedFanRoute>} />`
);
content = content.replace(
  /<Route path="\/ticket-setup" element=\{<ProtectedFanRoute><PageWrapper><TicketSetupView \/><\/PageWrapper><\/ProtectedFanRoute>\} \/>/,
  `<Route path="/auth" element={<AuthView />} />\n        <Route element={<ProtectedFanRoute />}><Route path="/ticket-setup" element={<PageWrapper><TicketSetupView /></PageWrapper>} /></Route>`
);

content = content.replace(
  /<Route path="\/auth" element=\{<AuthView \/>\} \/>/,
  `<Route path="/auth" element={<AuthView />} />`
);

// Handle initAuth
content = content.replace(
  "const { initSupabase, loadBootstrap, profile } = useAppStore()",
  "const { initSupabase, loadBootstrap, profile } = useAppStore()\n  const { initAuth } = useAuthService()"
);

content = content.replace(
  "useEffect(() => {\n    initSupabase()\n  }, [initSupabase])",
  "useEffect(() => {\n    initSupabase()\n    initAuth()\n  }, [initSupabase, initAuth])"
);

// Modify loadBootstrap logic: No longer needs stadiumId in App.tsx
content = content.replace(
  /if \(userId\) \{\n\s*\/\/ Pass empty string[\s\S]*?loadBootstrap\(userId, stadiumId \|\| ''\);\n\s*\}/,
  `if (userId && role === 'fan') {\n      loadBootstrap(userId);\n    }`
);
content = content.replace(
  ", stadiumId]",
  ", role]"
);

fs.writeFileSync(path, content);
console.log('App.tsx updated');
