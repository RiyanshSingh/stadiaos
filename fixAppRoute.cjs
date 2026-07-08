const fs = require('fs');

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const routeConfig = `
function ProtectedFanRoute() {
  const { userId, role } = useAuthService();
  const { ticket } = useAppStore();
  const location = useLocation();

  if (!userId || role !== 'fan') {
    return <Navigate to="/auth" replace />;
  }
  
  // If no ticket, force them to ticket setup
  if (ticket === null && location.pathname !== '/ticket-setup') {
    return <Navigate to="/ticket-setup" replace />;
  }

  return <Outlet />;
}
`;

content = content.replace(/function ProtectedFanRoute\(\) \{[\s\S]*?return <Outlet \/>;\n\}/, routeConfig);

fs.writeFileSync(path, content);
console.log('App.tsx protected route updated');
