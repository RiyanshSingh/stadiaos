const fs = require('fs');

const path = 'src/app/ops/OpsDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("import { supabase }")) {
  content = content.replace("import { useAuthService } from '@/services/authService';", "import { useAuthService } from '@/services/authService';\nimport { supabase } from '@/services/supabase';");
}

if (!content.includes("const [matches, setMatches] = useState")) {
  const newHeader = `  const { matchId, setOpsMatchContext, logout } = useAuthService();
  const { fetchIncidents, subscribeToIncidents, incidents } = useIncidentService();
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    async function loadMatches() {
      const { data } = await supabase.from('matches').select('id, title, status, stadiums(name)').order('start_time', { ascending: true });
      if (data) setMatches(data);
    }
    loadMatches();
  }, []);`;
  
  content = content.replace(/  const \{ matchId \} = useAuthService\(\);\n  const \{ fetchIncidents, subscribeToIncidents, incidents \} = useIncidentService\(\);\n  const \[snapshot, setSnapshot\] = useState<OpsSnapshot \| null>\(null\);/, newHeader);
}

if (!content.includes("select className")) {
  const replacementHeader = `<motion.header variants={itemVariants} className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white/90">
              <ShieldAlert className="w-7 h-7 text-white/70" />
              Command Center
            </h1>
            <p className="text-[13px] text-white/50 mt-1.5 font-medium uppercase tracking-widest">StadiaOS Real-time Operations</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className={cn("flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-sm", statusColor)}>
              <span className={cn("w-2 h-2 rounded-full animate-pulse", isDegraded ? "bg-red-400" : isElevated ? "bg-yellow-400" : "bg-white/70")} />
              <span className="text-[11px] font-bold tracking-widest uppercase">{statusText}</span>
            </div>
            
            <div className="flex items-center gap-4">
              <select 
                value={matchId || ''} 
                onChange={(e) => setOpsMatchContext(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[13px] font-medium text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30"
              >
                {matches.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#111]">{m.title} ({m.stadiums?.name})</option>
                ))}
              </select>
              <button onClick={logout} className="text-[12px] uppercase tracking-widest font-bold text-white/40 hover:text-white/80 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </motion.header>`;

  content = content.replace(/<motion\.header variants=\{itemVariants\} className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">[\s\S]*?<\/motion\.header>/, replacementHeader);
}

fs.writeFileSync(path, content);
console.log('OpsDashboard updated');
