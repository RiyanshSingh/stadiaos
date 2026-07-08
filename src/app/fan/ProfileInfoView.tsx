import { useState } from 'react'
import { ArrowLeft, Save, User, Phone, Mail } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/services/supabase'
import { useAuthService } from '@/services/authService'

export function ProfileInfoView() {
  const navigate = useNavigate()
  const { profile } = useAppStore()
  const { email } = useAuthService()
  
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) return

    setIsSaving(true)
    setMessage('')
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', profile.id)

      if (error) throw error

      // Update local store
      useAppStore.setState({
        profile: {
          ...profile,
          full_name: fullName,
          phone: phone,
        }
      })
      
      setMessage('Profile updated successfully!')
      setTimeout(() => navigate('/profile'), 1500)
    } catch (err: any) {
      console.error(err)
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col font-sans">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between relative z-10">
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white/70" />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Personal Info</h1>
        <div className="w-10 h-10" />
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 flex-1 relative z-10 max-w-lg mx-auto w-full">
        
        <Card className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20">
              <User className="w-8 h-8 text-white/50" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{profile?.full_name}</h2>
            <p className="text-xs text-white/40 font-medium uppercase tracking-widest mt-1">Fan Account</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold px-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-11 h-14 bg-black/50 border-white/10 rounded-2xl focus-visible:ring-white/20 text-[15px]"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold px-1">Email (Read Only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  disabled
                  value={profile?.email || email || ''}
                  className="pl-11 h-14 bg-white/5 border-white/5 rounded-2xl text-white/50 text-[15px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold px-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-11 h-14 bg-black/50 border-white/10 rounded-2xl focus-visible:ring-white/20 text-[15px]"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-sm text-center font-medium">
                {message}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSaving}
              className="w-full h-14 mt-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </button>
          </form>
        </Card>
      </main>
    </div>
  )
}
