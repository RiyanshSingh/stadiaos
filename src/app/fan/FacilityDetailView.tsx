import { ArrowLeft, Clock, MapPin, Navigation, ShieldAlert, Accessibility, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { facilityService, type FacilityViewModel } from '@/services/facilityService'
import { useAppStore } from '@/store/useAppStore'

export function FacilityDetailView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { match } = useAppStore()
  const [facility, setFacility] = useState<FacilityViewModel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id && match?.id) {
      facilityService.fetchFacilityById(id, match.id).then(data => {
        setFacility(data)
        setLoading(false)
      })
    }
  }, [id, match?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/30 text-[13px] font-medium uppercase tracking-widest">Loading facility...</p>
      </div>
    )
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-white/30 text-[13px] font-medium uppercase tracking-widest mb-4">Facility not found.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 rounded-2xl text-[13px] font-bold uppercase tracking-widest">Go Back</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Facility Details</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        {/* Facility Info Card */}
        <section>
          <Card className="glass-card p-6 border-0 bg-white/[0.04] rounded-[2rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl" />
            
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{facility.type}</p>
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-white/90">{facility.name}</h2>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-white/50 mb-8">
              <MapPin className="w-4 h-4" /> {facility.zone}
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Wait Time</p>
                <p className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/50" /> {facility.wait}
                </p>
              </div>
              <div className="flex-1 p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Crowd</p>
                <p className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Activity className="w-4 h-4 text-white/50" /> {facility.crowd}
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Info & Actions */}
        <section className="space-y-4">
          <div className="flex items-center gap-4 p-5 bg-white/[0.03] rounded-3xl border border-white/5">
            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
              <Accessibility className={`w-5 h-5 ${facility.accessible ? 'text-white' : 'text-white/30'}`} />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-tight text-white/90">{facility.accessible ? 'Fully Accessible' : 'Not marked accessible'}</p>
              <p className="text-[11px] font-medium text-white/50 mt-0.5">{facility.accessible ? 'Wheelchair access available' : 'Check with staff for assistance'}</p>
            </div>
          </div>

          <button onClick={() => navigate(`/map?dest=${facility.name}`)} className="w-full h-14 bg-white text-black font-bold rounded-2xl text-[13px] transition-all hover:bg-white/90 flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" /> Route to Facility
          </button>
        </section>

        {/* Alternatives (Mocked for now without routing/geo) */}
        <section>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Nearby Alternatives</h3>
          <div className="space-y-3">
            <Link to="/map" className="block">
              <Card className="glass-card p-5 rounded-3xl border border-white/5 bg-white/[0.03] flex items-center justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <p className="font-bold text-[13px] text-white/90">Nearest {facility.type}</p>
                  <p className="text-[11px] font-medium text-white/50 mt-0.5">Check map for directions</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <Navigation className="w-4 h-4 text-white/60" />
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* Report Issue */}
        <section className="pt-2">
          <button onClick={() => navigate(`/report?location=${facility.name}`)} className="w-full h-14 bg-white/5 border border-white/10 text-white/90 font-bold rounded-2xl text-[13px] transition-all hover:bg-white/10 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white/50" /> Report Issue with Facility
          </button>
        </section>

      </div>
    </div>
  )
}
