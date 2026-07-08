const fs = require('fs');
const file = 'src/app/fan/ProfileView.tsx';

const content = `import { useState } from 'react'
import { 
  User, MapPin, Ticket, ShieldAlert, Bookmark, Bell, 
  Settings, LogOut, ChevronRight, Activity, Accessibility, 
  Navigation, ArrowRight, Menu, X, Clock, Users, HeartPulse, Info
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import { useAuthService } from '@/services/authService'

export function ProfileView() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { profile, ticket, incidents, accessibleRouting, toggleAccessibleRouting } = useAppStore()
  const { logout } = useAuthService()

  const activeIncident = incidents.length > 0 ? incidents[0] : null;

  return (
    <div className="h-screen w-full bg-black text-white overflow-y-auto pb-32">
      
      {/* 1. Profile Header */}
      <div className="px-6 pt-12 pb-6 relative">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">Fan Account</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">{profile?.full_name || 'Fan Profile'}</h1>
            <div className="flex items-center gap-2 text-white/50 text-xs font-medium mt-1">
              <span>ID: {profile?.id?.split('-')[0].toUpperCase() || '---'}</span>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold uppercase tracking-wider backdrop-blur-md text-white/70">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              {ticket ? 'In Stadium' : 'Not in venue'}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white/50" />
            </div>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10"
            >
              <Menu className="w-5 h-5 text-white/80" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8">

        {/* 2. My Matchday */}
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">My Matchday</h2>
          <Card className="glass-card border border-white/5 p-5 rounded-3xl bg-white/[0.03]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Seat Assignment</p>
                <p className="text-2xl font-bold tracking-tight text-white">{ticket ? \`Sec \${ticket.seat_section}, Row \${ticket.seat_row}, Seat \${ticket.seat_number}\` : 'No Ticket'}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Entry Gate</p>
                <p className="text-lg font-semibold tracking-tight text-white">Gate C</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Link to={ticket ? \`/map?dest=section_\${ticket.seat_section}\` : '/map'} className="flex-1">
                <button className="w-full h-12 bg-white text-black hover:bg-white/90 transition-colors rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4" /> Route to Seat
                </button>
              </Link>
              <Link to="/map?dest=gate_c" className="flex-1">
                <button className="w-full h-12 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 border border-white/10 text-white/90">
                  <ArrowRight className="w-4 h-4" /> Saved Exit
                </button>
              </Link>
            </div>
          </Card>
        </section>

        {/* 3. My Reports */}
        <section>
          <div className="flex justify-between items-center mb-3 px-1">
            <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">My Reports</h2>
            <Link to="/my-reports" className="text-[11px] font-bold text-white/50 hover:text-white transition-colors uppercase tracking-widest">View All</Link>
          </div>
          <Link to="/my-reports" className="block">
            <Card className="glass-card border border-white/5 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-white/5 rounded-full border border-white/10 shrink-0">
                  <ShieldAlert className="w-4 h-4 text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-semibold tracking-tight text-[15px] truncate">{activeIncident ? \`\${activeIncident.type} at \${activeIncident.zone}\` : 'Spill at Gate C'}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-white/5 rounded-full text-white/60 shrink-0">{activeIncident ? activeIncident.status : 'In Progress'}</span>
                  </div>
                  <p className="text-[13px] text-white/50 leading-relaxed font-medium">{activeIncident ? activeIncident.description : 'Reported 12 mins ago. Maintenance team dispatched.'}</p>
                </div>
              </div>
            </Card>
          </Link>
        </section>

        {/* 4. Saved / Recent */}
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Saved & Recent</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/saved">
              <Card className="glass-card border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors bg-white/[0.03] flex flex-col justify-between h-28">
                <Bookmark className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="font-semibold text-[13px] tracking-tight text-white/90">Saved Routes</h3>
                  <p className="text-[11px] font-medium tracking-tight text-white/40 mt-0.5">2 locations</p>
                </div>
              </Card>
            </Link>
            <Link to="/copilot">
              <Card className="glass-card border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors bg-white/[0.03] flex flex-col justify-between h-28">
                <Activity className="w-5 h-5 text-white/40" />
                <div>
                  <h3 className="font-semibold text-[13px] tracking-tight text-white/90">Recent Asks</h3>
                  <p className="text-[11px] font-medium tracking-tight text-white/40 mt-0.5">3 chat logs</p>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* 5. Notifications & Alerts */}
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Notifications</h2>
          <Card className="glass-card border border-white/5 rounded-2xl overflow-hidden bg-white/[0.03]">
            <Link to="/alerts" className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-white/50" />
                <span className="font-medium text-[13px] text-white/90">Personal Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-bold tracking-widest">2 NEW</span>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
            </Link>
            <Link to="/map" className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-white/50" />
                <span className="font-medium text-[13px] text-white/90">Gate Changes</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </Link>
          </Card>
        </section>

        {/* 6. Accessibility & Preferences */}
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Preferences</h2>
          <Card className="glass-card border border-white/5 rounded-2xl overflow-hidden bg-white/[0.03]">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Accessibility className="w-5 h-5 text-white/50" />
                <div>
                  <p className="font-medium text-[13px] text-white/90 tracking-tight">Accessible Routing</p>
                  <p className="text-[11px] font-medium tracking-tight text-white/40 mt-0.5">Prioritize elevators & ramps</p>
                </div>
              </div>
              <button 
                onClick={toggleAccessibleRouting}
                className={\`w-11 h-6 rounded-full relative transition-colors border \${accessibleRouting ? 'bg-white border-white' : 'bg-white/10 border-white/10'}\`}
              >
                <motion.div 
                  layout
                  initial={false}
                  animate={{ x: accessibleRouting ? 20 : 2 }}
                  className={\`w-[18px] h-[18px] rounded-full absolute top-[2px] shadow-sm \${accessibleRouting ? 'bg-black' : 'bg-white/70'}\`} 
                />
              </button>
            </div>
          </Card>
        </section>

        {/* 7. Support / FAQ */}
        <section>
          <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Support</h2>
          <Card className="glass-card border border-white/5 rounded-2xl overflow-hidden bg-white/[0.03]">
            <Link to="/venue-info" className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
              <span className="font-medium text-[13px] text-white/90">Venue Policies</span>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </Link>
            <Link to="/accessibility" className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <span className="font-medium text-[13px] text-white/90">Help Center & FAQ</span>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </Link>
          </Card>
        </section>

        {/* 8. Account / Settings */}
        <section className="pt-6">
          <div className="flex flex-col gap-2">
            <Link to="/settings" className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-white/50" />
                <span className="font-medium text-[13px] text-white/90">Account Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30" />
            </Link>
            <button 
              onClick={logout}
              className="w-full p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
                <span className="font-medium text-[13px] text-white/70 group-hover:text-white/90 transition-colors">Sign Out</span>
              </div>
            </button>
          </div>
        </section>

      </div>

      {/* MORE SHEET / HAMBURGER MENU OVERLAY */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex items-end"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
            <div className="w-full h-[85vh] bg-black border-t border-white/10 rounded-t-3xl relative flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
              <div className="p-4 flex justify-center border-b border-white/5">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold tracking-tight">More Options</h2>
                  <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Activity, label: 'Match Center', path: '/match' },
                    { icon: Users, label: 'Queues & Facilities', path: '/facilities' },
                    { icon: Ticket, label: 'Ticket & Seat', path: '/ticket' },
                    { icon: ShieldAlert, label: 'My Reports', path: '/my-reports' },
                    { icon: Bookmark, label: 'Saved / Recent', path: '/saved' },
                    { icon: Info, label: 'Venue Info / FAQ', path: '/venue-info' },
                    { icon: Accessibility, label: 'Accessibility', path: '/accessibility' },
                    { icon: Settings, label: 'Settings', path: '/settings' }
                  ].map((item, idx) => (
                    <Link key={idx} to={item.path} onClick={() => setIsMenuOpen(false)}>
                      <Card className="glass-card p-4 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center text-center gap-2 h-24">
                        <item.icon className="w-6 h-6 text-white/70" />
                        <span className="text-[11px] font-medium tracking-wide uppercase text-white/90">{item.label}</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
`

fs.writeFileSync(file, content);
console.log('Profile view updated successfully');
