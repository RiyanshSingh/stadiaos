import { ArrowLeft, ShieldAlert, Navigation, Clock, Users, Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { alertService, type Alert } from '@/services/alertService'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function MatchCenterView() {
  const navigate = useNavigate()
  const match = useAppStore(s => s.match)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (match?.id) {
      alertService.fetchActiveAlerts(match.id).then((data) => {
        // filter only to advisories and critical for match center
        setAlerts(data.filter(a => a.type === 'advisory' || a.type === 'critical'))
        setLoading(false)
      })
    }
  }, [match?.id])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return ShieldAlert;
      case 'advisory': return Bell;
      default: return Bell;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Match Center</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        {/* Match Status Hero */}
        <section>
          <Card className="glass-card p-6 border-0 bg-white/[0.04] rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl" />
            
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-2">Live Status</p>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-white/90">{match?.title || 'Second Half'}</h2>
            
            <div className="flex items-center gap-2 mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-white/70 animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              <p className="text-[13px] font-medium text-white/50 tracking-tight">Match is Live • 65'</p>
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">End ETA</p>
                <p className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/50" /> 9:45 PM
                </p>
              </div>
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">Crowd</p>
                <p className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/50" /> Peak
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Live Advisories */}
        <section>
          <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 px-1">Live Advisories</h3>
          <div className="space-y-3">
            {!loading && alerts.length === 0 && (
              <p className="text-white/60 text-[13px] font-medium py-4 px-1 uppercase tracking-widest">No active advisories.</p>
            )}
            
            {!loading && alerts.map(alert => {
              const Icon = getAlertIcon(alert.type);
              const isCritical = alert.type === 'critical';
              return (
                <Link to="/alerts" key={alert.id} className="block group">
                  <Card className={cn("glass-card p-5 rounded-3xl border transition-colors flex gap-4",
                    isCritical ? "border-white/10 bg-white/[0.05] group-hover:bg-white/[0.08]" : "border-white/5 bg-white/[0.03] group-hover:bg-white/[0.05]"
                  )}>
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                      isCritical ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/60"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className={cn("font-bold text-[15px] mb-1 tracking-tight", isCritical ? "text-white" : "text-white/80")}>{alert.title}</p>
                      <p className="text-[13px] text-white/50 font-medium leading-relaxed">{alert.desc}</p>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Matchday Timeline */}
        <section>
          <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 px-1">Event Timeline</h3>
          <Card className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.03] space-y-8">
            
            <div className="flex gap-5 relative">
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white/20 border-2 border-white/50 z-10" />
                <div className="absolute top-3.5 bottom-[-2rem] left-[6px] w-[2px] bg-white/10" />
              </div>
              <div className="-mt-1">
                <p className="text-[10px] text-white/70 font-bold tracking-widest uppercase mb-1">6:00 PM</p>
                <p className="text-[15px] font-bold text-white/70 tracking-tight">Gates Open</p>
              </div>
            </div>
            
            <div className="flex gap-5 relative">
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-white/20 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                <div className="absolute top-3.5 bottom-[-2rem] left-[6px] w-[2px] bg-white/10" />
              </div>
              <div className="-mt-1">
                <p className="text-[10px] text-white font-bold tracking-widest uppercase mb-1">Now (Live)</p>
                <p className="text-[15px] font-bold text-white tracking-tight">Second Half Commences</p>
              </div>
            </div>
            
            <div className="flex gap-5 relative">
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-white/20 border-2 border-white/50 z-10" />
              </div>
              <div className="-mt-1 w-full">
                <p className="text-[10px] text-white/70 font-bold tracking-widest uppercase mb-1">9:45 PM</p>
                <p className="text-[15px] font-bold text-white/70 tracking-tight mb-3">Match Ends & Exit Phase</p>
                <Link to="/map?dest=gate_c" className="w-full h-12 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[13px] font-bold text-white/90 uppercase tracking-widest">
                  <Navigation className="w-4 h-4" /> View Exit Plan
                </Link>
              </div>
            </div>
            
          </Card>
        </section>
      </div>
    </div>
  )
}
