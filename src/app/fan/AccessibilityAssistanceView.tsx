import { ArrowLeft, Accessibility, Navigation, MapPin, VolumeX, ShieldAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

export function AccessibilityAssistanceView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Accessibility</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4">
        
        <Link to="/map" className="block">
          <Card className="glass-card p-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-between hover:bg-blue-500/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Navigation className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight text-white">Request Accessible Route</h3>
                <p className="text-xs text-white/70 mt-0.5">Prioritize elevators & ramps</p>
              </div>
            </div>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/facilities">
            <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center gap-2 h-28 hover:bg-white/10 transition-colors">
              <Accessibility className="w-6 h-6 text-white/70" />
              <span className="text-xs font-medium tracking-tight">Accessible Washrooms</span>
            </Card>
          </Link>
          <Link to="/facilities">
            <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center gap-2 h-28 hover:bg-white/10 transition-colors">
              <MapPin className="w-6 h-6 text-white/70" />
              <span className="text-xs font-medium tracking-tight">Wheelchair Points</span>
            </Card>
          </Link>
          <Link to="/facilities">
            <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center gap-2 h-28 hover:bg-white/10 transition-colors">
              <VolumeX className="w-6 h-6 text-white/70" />
              <span className="text-xs font-medium tracking-tight">Quiet Zones</span>
            </Card>
          </Link>
          <Link to="/report">
            <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center gap-2 h-28 hover:bg-white/10 transition-colors">
              <ShieldAlert className="w-6 h-6 text-white/70" />
              <span className="text-xs font-medium tracking-tight">Request Help</span>
            </Card>
          </Link>
        </div>

        <Card className="glass-card p-5 rounded-2xl border border-white/10 bg-white/5 mt-6">
          <h3 className="font-semibold tracking-tight mb-2">Assistance Instructions</h3>
          <p className="text-sm text-white/70 leading-relaxed">
            If you need immediate in-person assistance, please use the "Request Help" button above, or speak to any staff member wearing a high-visibility yellow vest. Sensory bags containing noise-canceling headphones are available at all Guest Services desks.
          </p>
        </Card>

      </div>
    </div>
  )
}
