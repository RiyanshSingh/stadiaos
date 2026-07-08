import { useState } from 'react'
import { ArrowLeft, Search, Coffee, ShieldAlert, Ticket, Navigation2, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'

export function SearchResultsView() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const results = [
    { type: 'facility', title: 'Main Food Court', icon: Coffee, desc: 'Food & Drink • North Plaza', path: '/facilities' },
    { type: 'route', title: 'Route to Section 214', icon: Navigation2, desc: 'Navigation • 5 min walk', path: '/route/seat' },
    { type: 'action', title: 'Report Security Issue', icon: ShieldAlert, desc: 'Help & Support', path: '/report' },
    { type: 'info', title: 'Bag Policy', icon: Info, desc: 'Venue Info • FAQ', path: '/venue-info' },
    { type: 'ticket', title: 'Match Ticket', icon: Ticket, desc: 'My Pass • Seat 12', path: '/ticket' }
  ]

  const filtered = query 
    ? results.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) || r.desc.toLowerCase().includes(query.toLowerCase()))
    : results

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Search</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 h-14 glass-input rounded-2xl text-base"
            placeholder="Search venue, facilities, help..."
            autoFocus
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
        {query && (
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-2">
            {filtered.length} Results for "{query}"
          </p>
        )}
        
        <div className="space-y-3">
          {filtered.map((res, i) => (
            <Link key={i} to={res.path} className="block">
              <Card className="glass-card p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl border border-white/5 text-white">
                  <res.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-white">{res.title}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{res.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="text-center pt-10">
              <p className="text-white/50 text-sm">No results found for "{query}".</p>
              <Link to="/copilot" className="inline-block mt-4 text-blue-400 text-sm font-medium hover:text-blue-300">
                Ask Copilot instead →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
