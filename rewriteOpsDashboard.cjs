const fs = require('fs');

const content = `import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ShieldAlert, Users, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIncidentService } from '@/services/incidentService';
import { opsService, type OpsSnapshot } from '@/services/opsService';
import { useAuthService } from '@/services/authService';
import { IncidentTriageDesk } from '@/components/ops/IncidentTriageDesk';
import { AlertComposer } from '@/components/ops/AlertComposer';
import { OperationsPanel } from '@/components/ops/OperationsPanel';
import { cn } from '@/lib/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function OpsDashboard() {
  const { matchId } = useAuthService();
  const { fetchIncidents, subscribeToIncidents, incidents } = useIncidentService();
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);

  useEffect(() => {
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

  const statusText = isDegraded ? 'SYSTEM DEGRADED' : isElevated ? 'ELEVATED LOAD' : 'SYSTEM NOMINAL';
  const statusColor = isDegraded ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                      isElevated ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 
                      'text-white/80 bg-white/5 border-white/10';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pb-[100px] relative overflow-hidden font-sans">
      {/* Dynamic Background Effects - Kept subtle */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

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
          <div className={cn("flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-sm", statusColor)}>
            <span className={cn("w-2 h-2 rounded-full animate-pulse", isDegraded ? "bg-red-400" : isElevated ? "bg-yellow-400" : "bg-white/70")} />
            <span className="text-[11px] font-bold tracking-widest uppercase">{statusText}</span>
          </div>
        </motion.header>

        {/* Top Summary Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/40 mb-4">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Open Incidents</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.activeIncidentsCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Pending Resolution</p>
          </Card>
          
          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/40 mb-4">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Active Advisories</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.activeAdvisoriesCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Broadcasted to Fans</p>
          </Card>

          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/40 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest font-bold">Congested Gates</span>
            </div>
            <p className="text-4xl font-bold tracking-tight text-white/90">{snapshot?.congestedGatesCount ?? '-'}</p>
            <p className="text-[11px] font-medium text-white/50 mt-2 uppercase tracking-widest">Med/High Density</p>
          </Card>

          <Card className="glass-card p-6 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors relative overflow-hidden">
            <div className="flex items-center gap-2 text-white/40 mb-4">
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

      </motion.div>
    </div>
  );
}
`

fs.writeFileSync('src/app/ops/OpsDashboard.tsx', content);
console.log('OpsDashboard updated');
