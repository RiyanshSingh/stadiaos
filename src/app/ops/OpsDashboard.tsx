import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldAlert, Users, AlertTriangle, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIncidentService } from '@/services/incidentService';
import { opsService, type OpsSnapshot } from '@/services/opsService';
import { useAuthService } from '@/services/authService';
import { supabase } from '@/services/supabase';
import { IncidentTriageDesk } from '@/components/ops/IncidentTriageDesk';
import { AlertComposer } from '@/components/ops/AlertComposer';
import { OperationsPanel } from '@/components/ops/OperationsPanel';
import { CreateMatchModal } from '@/components/ops/CreateMatchModal';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function OpsDashboard() {
  const { matchId, setOpsMatchContext, opsStadiumId, setOpsStadiumContext, logout } = useAuthService();
  const { fetchIncidents, subscribeToIncidents, incidents } = useIncidentService();
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);
  const [stadiums, setStadiums] = useState<any[]>([]);
  const [activeMatch, setActiveMatch] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const deleteMatch = async () => {
    if (!matchId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this match?");
    if (!confirmDelete) return;
    
    await supabase.from('matches').delete().eq('id', matchId);
    setOpsMatchContext(null);
  };

  const loadStadiums = async () => {
    const { data } = await supabase.from('stadiums').select('id, name').order('name');
    if (data) {
      setStadiums(data);
    }
  };

  useEffect(() => {
    loadStadiums();
  }, []);

  useEffect(() => {
    if (!opsStadiumId) return;
    
    const resolveMatchForToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('matches')
        .select('id')
        .eq('stadium_id', opsStadiumId)
        .eq('match_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (data) {
        setOpsMatchContext(data.id);
      } else {
        setOpsMatchContext(null);
      }
    };
    
    resolveMatchForToday();
    resolveMatchForToday();
  }, [opsStadiumId, setOpsMatchContext]);

  useEffect(() => {
    if (!matchId) {
      setActiveMatch(null);
      return;
    }
    
    supabase.from('matches').select('*').eq('id', matchId).single().then(({ data }) => {
      setActiveMatch(data);
    });
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    fetchIncidents(matchId);
    subscribeToIncidents(matchId);
    
    const loadSnapshot = async () => {
      const data = await opsService.fetchCommandCenterSnapshot(matchId);
      setSnapshot(data);
    };
    
    loadSnapshot();
    const interval = setInterval(loadSnapshot, 30000);
    return () => clearInterval(interval);
  }, [matchId, fetchIncidents, subscribeToIncidents]);

  // Deterministic system status rule
  const activeCriticals = incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;
  const isDegraded = activeCriticals > 0 || (snapshot?.highQueueFacilitiesCount ?? 0) > 3;
  const isElevated = activeCriticals === 0 && ((snapshot?.congestedGatesCount ?? 0) > 1 || (snapshot?.activeIncidentsCount ?? 0) > 5);

  const _statusText = isDegraded ? 'SYSTEM DEGRADED' : isElevated ? 'ELEVATED LOAD' : 'SYSTEM NOMINAL';
  const _statusColor = isDegraded ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                      isElevated ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 
                      'text-white/80 bg-white/5 border-white/10';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-[100px] relative overflow-hidden font-sans">
      {/* Dynamic Background Effects - Kept subtle */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-[1400px] mx-auto"
      >
        <motion.header variants={itemVariants} className="mb-10 pt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-white/90">
              <ShieldAlert className="w-7 h-7 text-white/70" />
              Command Center
            </h1>
            <p className="text-[13px] text-white/50 mt-1.5 font-medium uppercase tracking-widest">StadiaOS Real-time Operations</p>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3">
            {activeMatch && (
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mr-1">
                <span className="text-[13px] font-bold text-white tracking-tight">{activeMatch.title}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[11px] font-medium tracking-wide text-white/50 uppercase">{activeMatch.home_team} vs {activeMatch.away_team}</span>
              </div>
            )}
              {stadiums.length > 0 && (
                <select 
                  value={opsStadiumId || ''} 
                  onChange={(e) => setOpsStadiumContext(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-[13px] font-medium text-white/90 focus:outline-none focus:ring-1 focus:ring-white/30 min-w-[200px]"
                >
                  <option value="" disabled>Select a Stadium...</option>
                  {stadiums.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#111]">{s.name}</option>
                  ))}
                </select>
              )}
              {!matchId && opsStadiumId && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-4 py-1.5 text-[13px] font-medium text-white transition-colors whitespace-nowrap"
                >
                  + New Match
                </button>
              )}
              {matchId && (
                <button 
                  onClick={deleteMatch}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full px-4 py-1.5 text-[13px] font-medium text-red-400 transition-colors whitespace-nowrap"
                >
                  Delete Match
                </button>
              )}
              <button 
                onClick={async () => {
                  await logout();
                  window.location.href = '/auth';
                }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-1.5 text-[13px] font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
              >
                Log Out
              </button>
            </div>
        </motion.header>

        <CreateMatchModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          stadiumId={opsStadiumId}
          onSuccess={(newMatchId) => {
            setOpsMatchContext(newMatchId);
          }} 
        />

        {/* Top Summary Cards */}
        {matchId ? (
          <>
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Open Incidents</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.activeIncidentsCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Pending Resolution</p>
          </Card>
          
          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Active Advisories</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.activeAdvisoriesCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Broadcasted to Fans</p>
          </Card>

          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Congested Gates</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.congestedGatesCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Med/High Density</p>
          </Card>

          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/70 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">High Queue Facilities</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.highQueueFacilitiesCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Needs Attention</p>
          </Card>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-10">
            <IncidentTriageDesk />
            <AlertComposer />
          </motion.div>
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <OperationsPanel />
          </motion.div>
        </div>
        </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <ShieldAlert className="w-16 h-16 text-white/10 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Match Context</h2>
            <p className="text-white/50 max-w-md">
              Please select a match from the top right dropdown or create a new one to initialize the operations dashboard.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
