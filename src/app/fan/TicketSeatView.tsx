import { ArrowLeft, MapPin, Navigation, QrCode, ShieldAlert, Coffee } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

export function TicketSeatView() {
  const navigate = useNavigate()
  const ticket = useAppStore(s => s.ticket)
  const match = useAppStore(s => s.match)

  // Graceful empty state handling
  const hasTicket = !!ticket;
  
  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    } catch {
      return isoStr;
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Ticket & Seat</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        {/* Digital Ticket Card */}
        <section>
          <Card className={cn(
            "glass-card border bg-white/[0.04] rounded-[2rem] p-7 relative overflow-hidden",
            hasTicket ? "border-white/20" : "border-white/5"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Match Pass</p>
                  <Link to="/ticket-setup" className="text-[9px] font-bold text-white/60 uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors px-1.5 py-0.5 rounded-sm">Edit</Link>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white/90 leading-tight">{match?.title || 'No Active Match'}</h2>
                <p className="text-[13px] font-medium text-white/50 mt-1">{match?.start_time ? formatDate(match.start_time) : 'Time TBD'}</p>
              </div>
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2.5 shrink-0 shadow-lg">
                <QrCode className="w-full h-full text-black" strokeWidth={1.5} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">Sec</p>
                <p className="text-2xl font-bold tracking-tight">{ticket?.seat_section || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">Row</p>
                <p className="text-2xl font-bold tracking-tight">{ticket?.seat_row || '---'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">Seat</p>
                <p className="text-2xl font-bold tracking-tight text-white">{ticket?.seat_number || '---'}</p>
              </div>
            </div>

              <div className="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-white/50" />
                  <span className="text-[13px] font-bold text-white/70 tracking-tight">Recommended Entry:</span>
                </div>
                <span className="text-[15px] font-bold tracking-tight text-white">{ticket?.gate || (hasTicket ? 'See Map for Gate' : '---')}</span>
              </div>
          </Card>
        </section>

        {/* Seat Assistance Actions */}
        <section>
          <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 px-1">Seat Assistance</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to={hasTicket ? `/map?dest=section_${ticket.seat_section}` : '/map'} className="block h-full">
              <Card className="glass-card h-full p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3 text-center bg-white/[0.03]">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest">Route to Seat</span>
              </Card>
            </Link>
            <Link to="/facilities" className="block h-full">
              <Card className="glass-card h-full p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3 text-center bg-white/[0.03]">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Coffee className="w-5 h-5 text-white/70" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest">Amenities</span>
              </Card>
            </Link>
            <Link to={hasTicket ? `/report?location=section_${ticket.seat_section}` : '/report'} className="col-span-2 block">
              <Card className="glass-card p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors flex items-center gap-4 bg-white/[0.03]">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shrink-0">
                  <ShieldAlert className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold tracking-tight text-white/90">Report Seat Issue</h4>
                  <p className="text-[13px] font-medium text-white/50 mt-0.5">Spill, broken chair, etc.</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
