const fs = require('fs');

const content = `import { ArrowLeft, ShieldAlert, CheckCircle2, MapPin, Plus, ChevronDown, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { useIncidentService } from '@/services/incidentService'
import { useAuthService } from '@/services/authService'
import { motion, AnimatePresence } from 'framer-motion'

export function MyReportsView() {
  const navigate = useNavigate()
  const { userId } = useAuthService()
  const { myIncidents, fetchMyIncidents, subscribeToMyIncidents } = useIncidentService()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyIncidents(userId)
    subscribeToMyIncidents(userId)
  }, [userId, fetchMyIncidents, subscribeToMyIncidents])

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoString;
    }
  }

  const resolveLocation = (desc: string) => {
    const loc = desc.split('|')[0];
    if (!loc || loc.trim() === 'Location:') return 'General Venue';
    return loc.replace('Location: ', '').trim();
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 border-b border-white/5 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
              <ArrowLeft className="w-5 h-5 text-white/80" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">My Reports</h1>
          </div>
          <button 
            onClick={() => navigate('/report')} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-white/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-4">
        
        {myIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 mb-4">
              <ShieldAlert className="w-8 h-8 text-white/20" />
            </div>
            <p className="text-[13px] font-bold text-white/50 uppercase tracking-widest">No active reports</p>
            <p className="text-[13px] text-white/30 font-medium mt-2 max-w-[200px]">You haven't submitted any incidents for this match.</p>
          </div>
        ) : (
          myIncidents.map((report) => (
            <Card 
              key={report.id} 
              className="glass-card p-5 rounded-3xl border border-white/5 bg-white/[0.03] transition-colors cursor-pointer hover:bg-white/[0.05]"
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", 
                    report.status === 'resolved' ? "bg-white/5 border-white/20 text-white" : "bg-white/10 border-white/20 text-white"
                  )}>
                    {report.status === 'resolved' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] tracking-tight text-white/90 mb-1">{report.title || \`\${report.incident_type} Incident\`}</h3>
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/50">
                      <MapPin className="w-3.5 h-3.5" /> {resolveLocation(report.description)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    report.status === 'resolved' ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/60"
                  )}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform", expandedId === report.id ? "rotate-180" : "")} />
                </div>
              </div>

              <AnimatePresence>
                {expandedId === report.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-6 pt-6 border-t border-white/5">
                      <p className="text-[13px] text-white/70 leading-relaxed font-medium mb-6">
                        {report.description.split('|').slice(1).join('|').trim() || report.description}
                      </p>
                      
                      {report.updates && report.updates.length > 0 ? (
                        <div className="pl-4 border-l-2 border-white/10 space-y-5">
                          {report.updates.map((update, i) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-white border border-black shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                              <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="w-3 h-3 text-white/40" />
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{formatTime(update.created_at)}</p>
                              </div>
                              <p className="text-[13px] font-medium text-white/80 leading-relaxed">{update.note}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30">No updates yet. Support team is reviewing.</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))
        )}

      </div>
    </div>
  )
}
`

fs.writeFileSync('src/app/fan/MyReportsView.tsx', content);
console.log('My Reports updated');
