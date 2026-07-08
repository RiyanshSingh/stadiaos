const fs = require('fs');

const content = `import { ArrowLeft, MapPin, Coffee, Activity, ChevronRight, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'

export function SavedRecentView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 border-b border-white/5 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Saved & Recent</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        <section>
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Saved Routes</h2>
          <div className="space-y-3">
            <Link to="/map?dest=gate_c" className="block group">
              <Card className="glass-card p-5 rounded-3xl border border-white/5 bg-white/[0.03] flex items-center justify-between hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] tracking-tight text-white/90">Exit to Main Parking</h3>
                    <p className="text-[11px] font-medium text-white/50 mt-0.5">Custom Route via Gate C</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </Card>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Saved Facilities</h2>
          <div className="space-y-3">
            <Link to="/facility/fac_gate_b" className="block group">
              <Card className="glass-card p-5 rounded-3xl border border-white/5 bg-white/[0.03] flex items-center justify-between hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-colors shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[15px] tracking-tight text-white/90">Concession Stand B</h3>
                    <p className="text-[11px] font-medium text-white/50 mt-0.5">Section 214 Concourse</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </Card>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Recent Copilot Asks</h2>
          <div className="space-y-3">
            <Link to="/copilot?q=washroom" className="block group">
              <Card className="glass-card p-5 rounded-3xl border border-white/5 bg-white/[0.03] flex items-start gap-4 hover:bg-white/[0.05] transition-colors">
                <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0 mt-1">
                  <MessageSquare className="w-3.5 h-3.5 text-white/60" />
                </div>
                <div>
                  <p className="text-[15px] font-medium italic text-white/80 leading-snug">"Where is the nearest washroom with no line?"</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] uppercase font-bold tracking-widest text-white/30">
                    <Activity className="w-3 h-3" />
                    <span>2 hours ago</span>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
`

fs.writeFileSync('src/app/fan/SavedRecentView.tsx', content);
console.log('Saved & Recent updated');
