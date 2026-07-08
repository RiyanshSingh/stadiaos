import { useEffect, useState } from 'react';
import { DoorOpen, Coffee, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { opsService } from '@/services/opsService';
import { useAuthService } from '@/services/authService';
import { cn } from '@/lib/utils';
import type { FacilityViewModel } from '@/services/facilityService';
import type { GateStatus } from '@/services/dashboardService';

export function OperationsPanel() {
  const { matchId, opsStadiumId: stadiumId } = useAuthService();
  const [gates, setGates] = useState<GateStatus[]>([]);
  const [facilities, setFacilities] = useState<FacilityViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (!matchId || !stadiumId) return;
      setLoading(true);
      const data = await opsService.fetchOperationsHotspots(matchId, stadiumId);
      if (mounted) {
        setGates(data.gates);
        // Sort facilities by wait time descending for ops priority
        const sortedFacilities = [...data.facilities].sort((a, b) => parseInt(b.wait) - parseInt(a.wait));
        setFacilities(sortedFacilities);
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 15000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [matchId, stadiumId]);

  if (!matchId) return null;

  if (loading && gates.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Gates */}
      <section>
        <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 px-2">Gate Operations</h2>
        {gates.length === 0 ? (
          <div className="glass-card p-8 rounded-3xl border border-white/5 bg-white/[0.02] text-center">
             <AlertCircle className="w-6 h-6 text-white/20 mx-auto mb-3" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">No Gate Data</p>
          </div>
        ) : (
          <Card className="glass-card p-0 rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="divide-y divide-white/[0.05]">
              {gates.map(gate => (
                <div 
                  key={gate.gate} 
                  className="p-5 flex items-center justify-between hover:bg-white/[0.04] transition-colors group"
                >
                  <div>
                    <p className="font-bold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors">{gate.gate}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-white/40 uppercase tracking-widest">
                      <span>Wait:</span>
                      <span className="text-white/70">{gate.waitTime}m</span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                    gate.crowd === 'Low' ? "bg-white/5 text-white/40 border-transparent" :
                    gate.crowd === 'Medium' ? "bg-white/10 text-white/70 border-white/10" :
                    "bg-white/10 text-white border-white/20"
                  )}>
                    {gate.crowd}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* Facilities */}
      <section>
        <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 px-2">Facility Queues</h2>
        {facilities.length === 0 ? (
           <div className="glass-card p-8 rounded-3xl border border-white/5 bg-white/[0.02] text-center">
             <AlertCircle className="w-6 h-6 text-white/20 mx-auto mb-3" />
             <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">No Facility Data</p>
          </div>
        ) : (
          <Card className="glass-card p-0 rounded-3xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="divide-y divide-white/[0.05]">
              {facilities.map(facility => (
                <div 
                  key={facility.id} 
                  className="p-5 flex flex-col hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="pr-4">
                      <p className="font-bold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors mb-0.5">{facility.name}</p>
                      <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{facility.type} • {facility.zone}</p>
                    </div>
                    <div className={cn(
                      "shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                      facility.crowd === 'Low' ? "bg-white/5 text-white/40 border-transparent" :
                      facility.crowd === 'Medium' ? "bg-white/10 text-white/70 border-white/10" :
                      "bg-white/10 text-white border-white/20"
                    )}>
                      {facility.crowd}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Queue Est.</span>
                    <span className="text-[13px] font-bold text-white/90">{facility.wait}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
