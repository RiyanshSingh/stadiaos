import { ArrowLeft, User, Globe, Bell, Accessibility, LogOut, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthService } from '@/services/authService'
import { useState } from 'react'

export function SettingsView() {
  const navigate = useNavigate()
  const { logout } = useAuthService()
  const [lang, setLang] = useState('English')

  const toggleLanguage = () => {
    setLang(prev => prev === 'English' ? 'Español' : 'English')
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <header className="px-6 pt-12 pb-4 bg-black/90 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Go back" className="w-10 h-10 -ml-2 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors border border-white/10">
            <ArrowLeft className="w-5 h-5 text-white/80" aria-hidden="true" />
          </button>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32 space-y-8">
        
        <section>
          <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 px-1">Account</h2>
          <Card className="glass-card rounded-3xl border border-white/5 bg-white/[0.03] overflow-hidden">
            <Link to="/profile" className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.05] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                  <User className="w-4 h-4 text-white/70" />
                </div>
                <span className="font-bold text-[15px] tracking-tight text-white/90">Personal Info</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/60 transition-colors" />
            </Link>
            
            <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-5 hover:bg-white/[0.05] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                  <Globe className="w-4 h-4 text-white/70" />
                </div>
                <span className="font-bold text-[15px] tracking-tight text-white/90">Language</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-white/50">{lang}</span>
                <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/60 transition-colors" />
              </div>
            </button>
          </Card>
        </section>

        <section>
          <h2 className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-3 px-1">Preferences</h2>
          <Card className="glass-card rounded-3xl border border-white/5 bg-white/[0.03] overflow-hidden">
            <Link to="/notifications" className="flex items-center justify-between p-5 border-b border-white/5 hover:bg-white/[0.05] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/70" />
                </div>
                <span className="font-bold text-[15px] tracking-tight text-white/90">Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/60 transition-colors" />
            </Link>
            
            <Link to="/accessibility" className="flex items-center justify-between p-5 hover:bg-white/[0.05] transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                  <Accessibility className="w-4 h-4 text-white/70" />
                </div>
                <span className="font-bold text-[15px] tracking-tight text-white/90">Accessibility Options</span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 group-hover:text-white/60 transition-colors" />
            </Link>
          </Card>
        </section>

        <section className="pt-4">
          <button 
            onClick={() => {
              logout()
              navigate('/')
            }}
            aria-label="Sign out of StadiaOS"
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group"
          >
            <LogOut className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" aria-hidden="true" />
            <span className="font-bold text-[13px] uppercase tracking-widest text-white/50 group-hover:text-white/90 transition-colors">Sign Out</span>
          </button>
        </section>

      </div>
    </div>
  )
}
