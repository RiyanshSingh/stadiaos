import { ArrowLeft, ShieldCheck, DoorOpen, Coffee, Accessibility, LifeBuoy, Bus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function VenueInfoView() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Venue Policies & FAQ</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-4">
        
        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-lg">Prohibited Items</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">No bags larger than 14x14x6 inches. No outside food or drink, umbrellas, professional cameras, or weapons.</p>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <DoorOpen className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Entry Rules</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">Gates open 2 hours prior to kickoff. Re-entry is strictly prohibited. All guests are subject to search.</p>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Coffee className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold text-lg">Stadium Services</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">First Aid is located at sections 114, 214, and 314. Free WiFi available ('StadiaOS-Guest').</p>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Accessibility className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-lg">Accessibility</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">Accessible seating available on all levels. Sensory bags available at Guest Services.</p>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <LifeBuoy className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-lg">Emergency Help</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">In case of evacuation, follow instructions from staff and proceed to the nearest exit calmly.</p>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-2">
            <Bus className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold text-lg">Transport Info</h3>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">Rideshare pickup is at Lot C. Express train service runs for 90 minutes post-match.</p>
        </Card>

      </div>
    </div>
  )
}
