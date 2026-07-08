import { ArrowLeft, Bell, Navigation2, Ticket, MapPin, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate } from 'react-router-dom'

export function NotificationsView() {
  const navigate = useNavigate()

  const notifications = [
    { id: 1, type: 'alert', icon: AlertCircle, title: 'Incident Update', time: '10m ago', desc: 'Your reported spill at Gate C has been acknowledged by maintenance.', unread: true },
    { id: 2, type: 'route', icon: Navigation2, title: 'Route Suggestion', time: '25m ago', desc: 'Based on crowd data, we suggest taking the West Concourse to your seat.', unread: true },
    { id: 3, type: 'ticket', icon: Ticket, title: 'Ticket Upgraded', time: '2h ago', desc: 'You have been randomly selected for VIP Lounge access for the next 30 mins!', unread: false },
    { id: 4, type: 'venue', icon: MapPin, title: 'Gate Change', time: '4h ago', desc: 'Entry Gate C is experiencing high load. You may now enter through Gate D.', unread: false }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold">2 New</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32">
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`glass-card p-4 rounded-2xl border transition-colors hover:bg-white/10 cursor-pointer ${notif.unread ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 opacity-80'}`}>
              <div className="flex gap-4">
                <div className="mt-1 relative">
                  <div className="p-2.5 rounded-full bg-white/10 text-white">
                    <notif.icon className="w-4 h-4" />
                  </div>
                  {notif.unread && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-black" />}
                </div>
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-sm tracking-tight text-white">{notif.title}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 whitespace-nowrap ml-2">{notif.time}</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">{notif.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
