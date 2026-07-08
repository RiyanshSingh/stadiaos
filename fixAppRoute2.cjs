const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const routeConfig = `
function ProtectedFanRoute() {
  const { userId, role } = useAuthService();
  const { ticket, hasBootstrapped } = useAppStore();
  const location = useLocation();

  if (!userId || role !== 'fan') {
    return <Navigate to="/auth" replace />;
  }
  
  if (!hasBootstrapped) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/20" /></div>;
  }
  
  // If no ticket, force them to ticket setup
  if (!ticket && location.pathname !== '/ticket-setup') {
    return <Navigate to="/ticket-setup" replace />;
  }
  
  // If they have a ticket and try to access ticket setup, send to dashboard
  if (ticket && location.pathname === '/ticket-setup') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
`;

content = content.replace(/function ProtectedFanRoute\(\) \{[\s\S]*?return <Outlet \/>;\n\}/, routeConfig);
fs.writeFileSync(path, content);
console.log('App.tsx route updated for hasBootstrapped');
