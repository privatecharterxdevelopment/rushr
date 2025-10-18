'use client'

import { FormEvent, useEffect, useState } from 'react'
import { supabaseBrowser } from '../../../utils/supabase-browser'
const supabase = supabaseBrowser()
import { useRouter } from 'next/navigation'
import AdditionalZipCodes from '../../../components/AdditionalZipCodes'

const TRADES = ['HVAC','Plumbing','Electrical','Roofing','Landscaping','General']

export default function ProOnboardingPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [trade, setTrade] = useState(TRADES[0])
  const [serviceAreaZips, setServiceAreaZips] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/sign-in'); return }

      // If user picked homeowner by mistake, kick them out
      const { data: p } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      if (!p) { router.replace('/onboarding/choose-role'); return }
      if (p.role !== 'pro') { router.replace('/dashboard'); return }

      // Preload existing pro profile if any
      const { data: pro } = await supabase.from('pro_profiles').select('*').eq('user_id', session.user.id).single()
      if (pro) {
        setCompanyName(pro.company_name ?? '')
        setTrade(pro.trade ?? TRADES[0])
        // Convert comma-separated string back to array
        const zipsFromDb = pro.service_area ? pro.service_area.split(',').map((zip: string) => zip.trim()).filter(Boolean) : []
        setServiceAreaZips(zipsFromDb)
      }
      setLoading(false)
    }
    run()
  }, [router])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null); setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/sign-in'); return }

    // Upsert contractor data
    const { error: upsertErr } = await supabase.from('pro_profiles').upsert({
      user_id: session.user.id,
      company_name: companyName,
      trade,
      service_area: serviceAreaZips.join(', ')
    })
    if (upsertErr) { setError(upsertErr.message); setSaving(false); return }

    // Mark onboarding as pending review for now
    await supabase.from('profiles')
      .update({ pro_onboarding_status: 'pending_review' })
      .eq('id', session.user.id)

    setSaving(false)
    router.replace('/dashboard')
  }

  if (loading) return <div className="section"><div className="max-w-md mx-auto">Loading...</div></div>

  return (
    <section className="section">
      <div className="max-w-lg mx-auto card p-6 space-y-4">
        <h1 className="text-2xl font-bold text-ink">Become a Pro Rushr</h1>
        <p className="text-slate-700">Tell us a bit about your business. You can edit this later.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Company name</label>
            <input className="input w-full" value={companyName} onChange={e=>setCompanyName(e.target.value)} required />
          </div>

          <div>
            <label className="label">Primary trade</label>
            <select className="input w-full" value={trade} onChange={e=>setTrade(e.target.value)}>
              {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <AdditionalZipCodes
              additionalZips={serviceAreaZips}
              onUpdateZips={setServiceAreaZips}
              className="w-full"
            />
          </div>

          <button className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
        </form>

        {error && <p className="text-rose-600 text-sm">{error}</p>}
      </div>
    </section>
  )
}
