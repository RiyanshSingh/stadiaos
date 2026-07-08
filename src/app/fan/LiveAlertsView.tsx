import { ArrowLeft, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { alertService, type Alert } from '@/services/alertService'
import { useAppStore } from '@/store/useAppStore'

export function LiveAlertsView() {
  const navigate = useNavigate()
  const match = useAppStore(s => s.match)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (match?.id) {
      alertService.fetchActiveAlerts(match.id).then((data) => {
        setAlerts(data)
        setLoading(false)
      })
    }
  }, [match?.id])

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return AlertTriangle
      case 'advisory': return ShieldAlert
      case 'resolved': return CheckCircle2
      default: return AlertTriangle
    }
  }

  // Helper to format timestamps gracefully
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Live Alerts</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4">
        {loading ? (
           <p className="text-white/50 text-sm text-center mt-10">Loading alerts...</p>
        ) : alerts.length === 0 ? (
           <p className="text-white/50 text-sm text-center mt-10">No active alerts.</p>
        ) : (
          alerts.map((alert) => {
            const Icon = getIcon(alert.type)
            return (
              <Card key={alert.id} className={`glass-card p-4 rounded-2xl border ${alert.type === 'critical' ? 'border-red-500/30 bg-red-500/5' : alert.type === 'resolved' ? 'border-green-500/20 bg-green-500/5 opacity-70' : 'border-white/10 bg-white/5'}`}>
                <div className="flex gap-4">
                  <div className={`p-3 rounded-full h-fit ${alert.type === 'critical' ? 'bg-red-500/20 text-red-500' : alert.type === 'resolved' ? 'bg-green-500/20 text-green-500' : 'bg-white/10 text-white'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-semibold tracking-tight ${alert.type === 'critical' ? 'text-red-400' : 'text-white'}`}>{alert.title}</h3>
                      <span className="text-[10px] uppercase tracking-wider text-white/50">{formatTime(alert.created_at)}</span>
                    </div>
                    <p className="text-sm text-white/70 leading-relaxed">{alert.desc}</p>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
