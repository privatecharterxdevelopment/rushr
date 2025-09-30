'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '../../../utils/supabase-browser'
const supabase = supabaseBrowser()
import { useRouter } from 'next/navigation'

export default function ChooseRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/sign-in'); return }
      setLoading(false)
    }
    run()
  }, [router])

  async function pick(role: 'homeowner'|'pro') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/sign-in'); return }

    await supabase.from('profiles')
      .update({
        role,
        pro_onboarding_status: role === 'pro' ? 'in_progress' : 'not_started'
      })
      .eq('id', session.user.id)

    if (role === 'homeowner') router.replace('/dashboard')
    else router.replace('/contractor-signup') // use your existing wizard
  }

  if (loading) return <div className="section"><div className="max-w-md mx-auto">Loading...</div></div>

  return (
    <section className="section">
      <div className="max-w-lg mx-auto card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-ink">How will you use Rushr?</h1>
        <p className="text-slate-700">Pick one to continue. You can change this later in your profile.</p>
        <div className="grid md:grid-cols-2 gap-3">
          <button className="btn-primary w-full" onClick={()=>pick('homeowner')}>I am a homeowner</button>
          <button className="btn w-full" onClick={()=>pick('pro')}>I am a contractor</button>
        </div>
      </div>
    </section>
  )
}
