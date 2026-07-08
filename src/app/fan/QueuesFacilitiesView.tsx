import { ArrowLeft, Coffee, ShoppingBag, Stethoscope, Droplets, User, MapPin, Accessibility, ArrowRight, HelpCircle, Navigation } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { facilityService, type FacilityViewModel } from '@/services/facilityService'
import { useAppStore } from '@/store/useAppStore'

export function QueuesFacilitiesView() {
  const navigate = useNavigate()
  const { match } = useAppStore()
  
  const [activeFilter, setActiveFilter] = useState('food')
  const [activeSort, setActiveSort] = useState('nearest')
  const [facilities, setFacilities] = useState<FacilityViewModel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (match?.id && match?.stadium_id) {
      facilityService.fetchFacilities(match.stadium_id, match.id).then((data) => {
        setFacilities(data)
        setLoading(false)
      })
    }
  }, [match?.id, match?.stadium_id])

  const filters = [
    { id: 'food', icon: Coffee, label: 'Food' },
    { id: 'washroom', icon: User, label: 'Washroom' },
    { id: 'medical', icon: Stethoscope, label: 'Medical' },
    { id: 'merchandise', icon: ShoppingBag, label: 'Merch' },
    { id: 'water', icon: Droplets, label: 'Water' },
    { id: 'helpdesk', icon: HelpCircle, label: 'Help' }
  ]

  const sorts = [
    { id: 'nearest', label: 'Nearest' },
    { id: 'shortest', label: 'Shortest Queue' },
    { id: 'accessible', label: 'Accessible Only' },
    { id: 'open', label: 'Open Now' }
  ]

  const filteredFacilities = useMemo(() => {
    let result = facilities.filter(f => f.type === activeFilter);
    
    if (activeSort === 'accessible') {
      result = result.filter(f => f.accessible);
    } else if (activeSort === 'shortest') {
      result.sort((a, b) => parseInt(a.wait) - parseInt(b.wait));
    }
    // 'nearest' and 'open' are placeholders for now without geo-routing
    return result;
  }, [facilities, activeFilter, activeSort]);

  const smartPick = filteredFacilities.length > 0 ? filteredFacilities[0] : null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white/80" aria-hidden="true" />
            </button>
            <h1 className="text-xl font-bold tracking-tight">Queues & Facilities</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-4 pb-32">
        
        {/* Smart Recommendation Banner */}
        {smartPick && !loading && (
          <div className="px-6 mb-6">
            <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">Smart Pick</h2>
            <Card className="glass-card bg-white/[0.04] border border-white/10 p-5 rounded-3xl flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-lg font-bold tracking-tight text-white">{smartPick.name}</p>
                <p className="text-[13px] text-white/50 font-medium mt-1">Shortest wait for {activeFilter}</p>
              </div>
              <Link to={`/map?dest=${smartPick.name}`} aria-label={`Navigate to ${smartPick.name}`}>
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-colors shrink-0">
                  <Navigation className="w-5 h-5" aria-hidden="true" />
                </div>
              </Link>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-6 mb-8">
          <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3">Categories</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
            {filters.map((f) => (
              <button 
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                aria-pressed={activeFilter === f.id}
                aria-label={`Filter by ${f.label}`}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 h-20 w-20 rounded-2xl border transition-all shrink-0",
                  activeFilter === f.id
                    ? "bg-white/10 border-white/30 text-white"
                    : "bg-black hover:bg-white/5 border-white/10 text-white/70"
                )}
              >
                <f.icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-[10px] font-bold tracking-widest uppercase">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort / View Mode */}
        <div className="px-6 mb-6">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
            {sorts.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSort(s.id)}
                className={cn(
                  "px-4 py-2 rounded-full border text-[11px] font-bold tracking-widest uppercase whitespace-nowrap transition-colors",
                  activeSort === s.id
                    ? "bg-white text-black border-white"
                    : "bg-transparent border-white/20 text-white/50 hover:bg-white/10 hover:text-white/80"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Facility List */}
        <div className="px-6 space-y-4 pb-6">
          {loading ? (
            <p className="text-white/60 text-[13px] font-medium text-center py-10 uppercase tracking-widest">Loading facilities...</p>
          ) : filteredFacilities.length === 0 ? (
            <p className="text-white/60 text-[13px] font-medium text-center py-10 uppercase tracking-widest">No facilities found.</p>
          ) : (
            filteredFacilities.map((fac) => (
              <Link key={fac.id} to={`/facility/${fac.id}`} className="block group">
                <Card className="glass-card border border-white/5 p-5 rounded-3xl bg-white/[0.03] group-hover:bg-white/[0.05] transition-colors relative overflow-hidden">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-lg tracking-tight text-white/90">{fac.name}</h3>
                      <div className="flex items-center gap-1.5 text-[13px] text-white/50 font-medium mt-1">
                        <MapPin className="w-3.5 h-3.5" /> {fac.zone}
                      </div>
                    </div>
                    {fac.accessible && (
                      <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                        <Accessibility className="w-4 h-4 text-white/60" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-center items-center">
                      <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Wait</p>
                      <p className="text-[15px] font-bold text-white tracking-tight">{fac.wait}</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-center items-center">
                      <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Crowd</p>
                      <p className="text-[15px] font-bold text-white tracking-tight">{fac.crowd}</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col justify-center items-center">
                      <p className="text-[10px] text-white/70 uppercase tracking-widest font-bold mb-1">Dist</p>
                      <p className="text-[15px] font-bold text-white tracking-tight">{fac.distance}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[13px] font-bold text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">View Details</span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:border-white group-hover:text-black transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
