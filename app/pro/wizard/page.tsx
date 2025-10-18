'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AiRewriteBubble from '@/components/AiRewriteBubble'
import TagInput from '@/components/TagInput'

/* ====================== Types ====================== */
type Day = 'Mon'|'Tue'|'Wed'|'Thu'|'Fri'|'Sat'|'Sun'
type Hours = Record<Day, { enabled: boolean; open: string; close: string }>
type RateType = 'Hourly'|'Flat'|'Visit fee'
type PaymentMethod = 'Visa'|'Mastercard'|'AmEx'|'Discover'|'ACH'|'Cash'|'Check'|'Zelle'|'Venmo'
type StepId = 'basics'|'area'|'credentials'|'pricing'|'review'
type Mode = 'wizard'|'full'

type FormDataT = {
  name: string; email: string; phone: string
  businessName: string; website: string
  yearsInBusiness: string; teamSize: string; about: string
  baseZip: string; radiusMiles: number; extraZips: string[]
  categories: string[]; specialties: string[]
  emergency: boolean; hours: Hours
  licenseNumber: string; licenseType: string; licenseState: string; licenseExpires: string
  insuranceCarrier: string; insurancePolicy: string; insuranceExpires: string
  rateType: RateType; hourlyRate: string; flatMin: string; visitFee: string; freeEstimates: boolean
  payments: PaymentMethod[]
  instagram: string; facebook: string; yelp: string; google: string
  logo: File | null; portfolio: File[]; licenseProof: File | null; insuranceProof: File | null
  agreeTerms: boolean; certifyAccuracy: boolean
}

/* ====================== Constants ====================== */
const STEPS: StepId[] = ['basics','area','credentials','pricing','review']
const TITLES: Record<StepId,string> = {
  basics: 'Business basics',
  area: 'Service area & categories',
  credentials: 'Credentials',
  pricing: 'Pricing & availability',
  review: 'Preview & submit'
}
const DAYS: Day[] = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const EMPTY_HOURS: Hours = DAYS.reduce((acc, d) => {
  (acc as any)[d] = { enabled: ['Mon','Tue','Wed','Thu','Fri'].includes(d), open:'09:00', close:'17:00' }
  return acc
}, {} as Hours)
const PMETHODS: PaymentMethod[] = ['Visa','Mastercard','AmEx','Discover','ACH','Cash','Check','Zelle','Venmo']
const DRAFT_KEY = 'rushr.contractor.signup.v1'

/* ====================== Page ====================== */
export default function ContractorSignup() {
  const router = useRouter()
  const sp = useSearchParams()

  const categories = useMemo<string[]>(
    () => ['Electrical','HVAC','Roofing','Plumbing','Carpentry','General','Landscaping'],
    []
  )

  const [form, setForm] = useState<FormDataT>(()=>({
    name:'', email:'', phone:'',
    businessName:'', website:'',
    yearsInBusiness:'', teamSize:'', about:'',
    baseZip:'', radiusMiles:10, extraZips:[],
    categories:[], specialties:[],
    emergency:false, hours:{...EMPTY_HOURS},
    licenseNumber:'', licenseType:'', licenseState:'', licenseExpires:'',
    insuranceCarrier:'', insurancePolicy:'', insuranceExpires:'',
    rateType:'Hourly', hourlyRate:'', flatMin:'', visitFee:'', freeEstimates:true,
    payments:['Visa','Mastercard','AmEx'],
    instagram:'', facebook:'', yelp:'', google:'',
    logo:null, portfolio:[], licenseProof:null, insuranceProof:null,
    agreeTerms:false, certifyAccuracy:false,
  }))

  const [mode, setMode] = useState<Mode>('wizard')
  const [step, setStep] = useState<StepId>('basics')
  const idx = STEPS.indexOf(step)
  const canBack = idx > 0
  const canNext = idx < STEPS.length - 1

  const [errors, setErrors] = useState<Record<string,string>>({})
  const [busy, setBusy] = useState(false)

  /* ---------------- Draft load + URL sync ---------------- */
  useEffect(()=>{
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        setForm(f=>({ ...f, ...migrateDraft(saved), logo:null, portfolio:[], licenseProof:null, insuranceProof:null }))
      }
    } catch {}
    const s = sp.get('step') as StepId | null
    if (s && STEPS.includes(s)) setStep(s)
    const m = sp.get('mode') as Mode | null
    if (m==='full' || m==='wizard') setMode(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(()=>{
    const qs = new URLSearchParams(sp.toString())
    qs.set('step', step)
    qs.set('mode', mode)
    router.replace(`?${qs.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode])

  /* ---------------- Helpers ---------------- */
  function set<K extends keyof FormDataT>(k: K, v: FormDataT[K]) { setForm(prev => ({ ...prev, [k]: v })) }
  function setHours(day: Day, patch: Partial<Hours[Day]>) {
    setForm(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...prev.hours[day], ...patch } } }))
  }
  function toggle<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v] }
  const zip5 = (z:string) => /^\d{5}$/.test(z)

  /* ---------------- Validation ---------------- */
  const validateBasics = (f: FormDataT) => {
    const e: Record<string,string> = {}
    if (!f.name.trim()) e.name = 'Required'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Valid email required'
    if (!/^[-+() 0-9]{7,}$/.test(f.phone)) e.phone = 'Phone looks off'
    if (!f.businessName.trim()) e.businessName = 'Required'
    return e
  }
  const validateArea = (f: FormDataT) => {
    const e: Record<string,string> = {}
    if (!zip5(f.baseZip)) e.baseZip = '5-digit ZIP'
    if (!f.categories.length) e.categories = 'Pick at least one'
    const bad = f.extraZips.find(z=>!zip5(z))
    if (bad) e.extraZips = `Invalid ZIP: ${bad}`
    return e
  }
  const validateCredentials = (f: FormDataT) => {
    const e: Record<string,string> = {}
    if (!f.licenseNumber.trim()) e.licenseNumber = 'Required'
    if (!f.licenseState.trim()) e.licenseState = 'Required'
    if (!f.licenseExpires.trim()) e.licenseExpires = 'Required'
    if (!f.insuranceCarrier.trim()) e.insuranceCarrier = 'Required'
    if (!f.insurancePolicy.trim()) e.insurancePolicy = 'Required'
    if (!f.insuranceExpires.trim()) e.insuranceExpires = 'Required'
    // uploads required
    if (!f.licenseProof) e.licenseProof = 'Upload required'
    if (!f.insuranceProof) e.insuranceProof = 'Upload required'
    // simple expiry check
    const today = new Date().toISOString().slice(0,10)
    if (f.licenseExpires && f.licenseExpires < today) e.licenseExpires = 'License expired'
    if (f.insuranceExpires && f.insuranceExpires < today) e.insuranceExpires = 'Policy expired'
    return e
  }
  const validatePricing = (f: FormDataT) => {
    const e: Record<string,string> = {}
    const openAny = DAYS.some(d=>f.hours[d].enabled)
    if (!openAny) e.hours = 'Enable at least one day'
    if (f.rateType==='Hourly' && !f.hourlyRate.trim()) e.hourlyRate = 'Add hourly rate'
    if (f.rateType==='Flat'   && !f.flatMin.trim())   e.flatMin   = 'Add a typical flat amount'
    if (f.rateType==='Visit fee' && !f.visitFee.trim()) e.visitFee = 'Add a visit/diagnostic fee'
    return e
  }
  const validateReview = (f: FormDataT) => {
    const e: Record<string,string> = {}
    if (!f.agreeTerms) e.agreeTerms = 'You must accept'
    if (!f.certifyAccuracy) e.certifyAccuracy = 'Please certify'
    return e
  }
  const validators: Record<StepId,(f:FormDataT)=>Record<string,string>> = {
    basics: validateBasics, area: validateArea, credentials: validateCredentials, pricing: validatePricing, review: validateReview
  }
  function validateAll(f: FormDataT) {
    return { ...validateBasics(f), ...validateArea(f), ...validateCredentials(f), ...validatePricing(f), ...validateReview(f) }
  }
  function scrollToFirstError(eobj: Record<string,string>) {
    const first = Object.keys(eobj)[0]
    if (!first) return
    document.querySelector<HTMLElement>(`[data-err="${first}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' })
  }

  /* ---------------- Draft actions (kept for restore only) ---------------- */
  function saveDraft() {
    try {
      const { logo, portfolio, licenseProof, insuranceProof, ...json } = form
      localStorage.setItem(DRAFT_KEY, JSON.stringify(json))
    } catch {}
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY) } catch {} }

  /* ---------------- Submit ---------------- */
async function submitAll(e?: React.FormEvent) {
  e?.preventDefault()

  const eobj = validateAll(form)
  setErrors(eobj)
  if (Object.keys(eobj).length) {
    console.log('[contractor] validation errors', Object.keys(eobj))
    scrollToFirstError(eobj)
    return
  }

  setBusy(true)
  console.log('[contractor] submit start')

  try {
    // Get current user session
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()
    console.log('[contractor] sessionErr?', sessErr || null)

    if (!session) {
      alert('Please sign in first.')
      router.push('/pro/sign-in')
      setBusy(false)
      return
    }
    console.log('[contractor] user', session.user?.id)

    // Update pro_contractors table
    const { error: profileError } = await supabase
      .from('pro_contractors')
      .upsert({
        id: session.user.id,
        email: form.email,
        name: form.name,
        business_name: form.businessName,
        phone: form.phone,
        license_number: form.licenseNumber,
        license_state: form.licenseState,
        insurance_carrier: form.insuranceCarrier,
        categories: form.categories,
        base_zip: form.baseZip,
        service_area_zips: [form.baseZip, ...form.extraZips],
        service_radius_miles: form.radiusMiles,
        status: 'approved', // Auto-approve
        kyc_status: 'completed', // Mark KYC as completed
        kyc_completed_at: new Date().toISOString(),
        profile_approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('[contractor] profile error', profileError)
      throw new Error(profileError.message)
    }

    clearDraft()
    alert('Profile submitted and approved! Welcome to Rushr Pro.')
    router.push('/dashboard/contractor')
  } catch (err: any) {
    console.error('[contractor] submit error', err)
    alert(err?.message || 'Could not submit right now.')
  } finally {
    setBusy(false)
  }
}

  /* ---------------- UI helpers ---------------- */
  function nextStep() {
    const eobj = validators[step](form); setErrors(eobj)
    if (Object.keys(eobj).length) { scrollToFirstError(eobj); return }
    if (idx < STEPS.length-1) setStep(STEPS[idx+1])
  }
  const prevStep = () => { if (idx>0) setStep(STEPS[idx-1]) }
  const badgeErr = (key: string) => errors[key] ? 'ring-rose-300 border-rose-300' : ''
  const hintErr  = (key: string) => errors[key] ? <div className="mt-1 text-[11px] text-rose-600">{errors[key]}</div> : null
  const SectionTitle = ({children}:{children:React.ReactNode}) => (<div className="text-sm font-semibold text-slate-900 mb-2">{children}</div>)

  /* ====================== Render ====================== */
  return (
    <section className="section min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Become a Rushr Pro</h1>
            <p className="text-slate-600 mt-1">Tell us about your business so homeowners can hire you with confidence.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50" onClick={()=> setMode(m => m==='wizard' ? 'full' : 'wizard')}>
              {mode==='wizard' ? 'Switch to full form' : 'Switch to wizard'}
            </button>
          </div>
        </div>

        {/* Progress (wizard) */}
        {mode==='wizard' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>{TITLES[step]}</span>
              <span>Step {idx+1} of {STEPS.length}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 transition-[width]" style={{ width: `${(idx)/(STEPS.length-1)*100}%` }} />
            </div>
          </div>
        )}

        {/* ------------- WIZARD ------------- */}
        {mode==='wizard' && (
          <form onSubmit={submitAll} className="bg-white rounded-lg shadow-md p-6">
            {step==='basics' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div data-err="name">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('name')}`} value={form.name} onChange={e=>set('name', e.target.value)} placeholder="Alex Contractor" />
                  {hintErr('name')}
                </div>
                <div data-err="email">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('email')}`} value={form.email} onChange={e=>set('email', e.target.value)} placeholder="you@company.com" />
                  {hintErr('email')}
                </div>
                <div data-err="phone">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('phone')}`} value={form.phone} onChange={e=>set('phone', e.target.value)} placeholder="(555) 555-5555" />
                  {hintErr('phone')}
                </div>
                <div data-err="businessName">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('businessName')}`} value={form.businessName} onChange={e=>set('businessName', e.target.value)} placeholder="BrightSpark Electric LLC" />
                  {hintErr('businessName')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input className="w-full px-3 py-2 border rounded-md" value={form.website} onChange={e=>set('website', e.target.value)} placeholder="https://example.com" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years in business</label>
                    <input className="w-full px-3 py-2 border rounded-md" value={form.yearsInBusiness} onChange={e=>set('yearsInBusiness', e.target.value)} placeholder="e.g., 8" inputMode="numeric" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team size</label>
                    <input className="w-full px-3 py-2 border rounded-md" value={form.teamSize} onChange={e=>set('teamSize', e.target.value)} placeholder="e.g., 3" inputMode="numeric" />
                  </div>
                </div>

                {/* About */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">About your business</label>
                  <textarea
                    className="w-full min-h-[120px] px-3 py-2 border rounded-md"
                    value={form.about}
                    onChange={(e)=>set('about', e.target.value)}
                    placeholder="What you specialize in, what customers love, service guarantees, etc."
                  />
                </div>

                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo (optional)</label>
                  {!form.logo ? (
                    <label className="px-4 py-2 border rounded-md cursor-pointer inline-block hover:bg-gray-50">
                      Upload
                      <input type="file" className="hidden" accept="image/*" onChange={e=> set('logo', e.target.files?.[0] ?? null)} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3">
                      <img src={URL.createObjectURL(form.logo)} alt="logo preview" className="h-16 w-16 object-contain rounded border border-slate-200 bg-white" />
                      <button type="button" className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={()=>set('logo', null)}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step==='area' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div data-err="baseZip">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base ZIP *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('baseZip')}`} value={form.baseZip} onChange={e=>set('baseZip', e.target.value)} placeholder="11215" inputMode="numeric" />
                  {hintErr('baseZip')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coverage radius (miles)</label>
                  <select className="w-full px-3 py-2 border rounded-md" value={form.radiusMiles} onChange={e=>set('radiusMiles', Number(e.target.value))}>
                    {[5,10,15,25,50].map(n=><option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2" data-err="extraZips">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional ZIPs</label>
                  <TagInput
                    values={form.extraZips}
                    onChange={(vals)=>set('extraZips', vals)}
                    placeholder="Type ZIP and press Enter (or comma)…"
                    allowComma
                    allowEnter
                    inputMode="numeric"
                    validate={(v)=> /^\d{5}$/.test(v) ? null : '5-digit ZIP'}
                  />
                  {hintErr('extraZips')}
                </div>

                <div data-err="categories" className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categories you serve *</label>
                  <div className={`rounded-xl border p-2 ${errors.categories ? 'border-rose-300 ring-rose-300' : 'border-slate-200'}`}>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c=>(
                        <button
                          key={c}
                          type="button"
                          onClick={()=> set('categories', toggle(form.categories, c))}
                          className={`px-3 py-1.5 rounded-lg border text-sm ${
                            form.categories.includes(c)
                              ? 'border-blue-500 text-blue-700 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hintErr('categories')}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                  <TagInput
                    values={form.specialties}
                    onChange={(vals)=>set('specialties', vals)}
                    placeholder="Add specialties (Enter or comma)…"
                    allowComma
                    allowEnter
                  />
                </div>
              </div>
            )}

            {step==='credentials' && (
              <div className="grid md:grid-cols-2 gap-4">
                <div data-err="licenseNumber">
                  <label className="block text-sm font-medium text-gray-700 mb-1">License # *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('licenseNumber')}`} value={form.licenseNumber} onChange={e=>set('licenseNumber', e.target.value)} placeholder="123456" />
                  {hintErr('licenseNumber')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License type</label>
                  <input className="w-full px-3 py-2 border rounded-md" value={form.licenseType} onChange={e=>set('licenseType', e.target.value)} placeholder="Master electrician, Home improvement contractor…" />
                </div>
                <div data-err="licenseState">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issuing state/authority *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('licenseState')}`} value={form.licenseState} onChange={e=>set('licenseState', e.target.value)} placeholder="NY (DOB), NJ (DCA), etc." />
                  {hintErr('licenseState')}
                </div>
                <div data-err="licenseExpires">
                  <label className="block text-sm font-medium text-gray-700 mb-1">License expires *</label>
                  <input type="date" className={`w-full px-3 py-2 border rounded-md ${badgeErr('licenseExpires')}`} value={form.licenseExpires} onChange={e=>set('licenseExpires', e.target.value)} />
                  {hintErr('licenseExpires')}
                </div>

                <div data-err="insuranceCarrier">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Insurance carrier *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('insuranceCarrier')}`} value={form.insuranceCarrier} onChange={e=>set('insuranceCarrier', e.target.value)} placeholder="ABC Insurance" />
                  {hintErr('insuranceCarrier')}
                </div>
                <div data-err="insurancePolicy">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy # *</label>
                  <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('insurancePolicy')}`} value={form.insurancePolicy} onChange={e=>set('insurancePolicy', e.target.value)} placeholder="POL-1234567" />
                  {hintErr('insurancePolicy')}
                </div>
                <div data-err="insuranceExpires">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy expires *</label>
                  <input type="date" className={`w-full px-3 py-2 border rounded-md ${badgeErr('insuranceExpires')}`} value={form.insuranceExpires} onChange={e=>set('insuranceExpires', e.target.value)} />
                  {hintErr('insuranceExpires')}
                </div>

                {/* License proof */}
                <div data-err="licenseProof">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload license proof (PDF/JPG)</label>
                  {!form.licenseProof ? (
                    <label className="px-4 py-2 border rounded-md cursor-pointer inline-block hover:bg-gray-50">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,image/*" onChange={e=> set('licenseProof', e.target.files?.[0] ?? null)} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate max-w-[240px]">{form.licenseProof.name}</span>
                      <button type="button" className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={()=>set('licenseProof', null)}>Remove</button>
                    </div>
                  )}
                  {hintErr('licenseProof')}
                </div>

                {/* Insurance proof */}
                <div data-err="insuranceProof">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload insurance COI (PDF/JPG)</label>
                  {!form.insuranceProof ? (
                    <label className="px-4 py-2 border rounded-md cursor-pointer inline-block hover:bg-gray-50">
                      Upload
                      <input type="file" className="hidden" accept=".pdf,image/*" onChange={e=> set('insuranceProof', e.target.files?.[0] ?? null)} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="truncate max-w-[240px]">{form.insuranceProof.name}</span>
                      <button type="button" className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={()=>set('insuranceProof', null)}>Remove</button>
                    </div>
                  )}
                  {hintErr('insuranceProof')}
                </div>
              </div>
            )}

            {step==='pricing' && (
              <div className="space-y-4">
                <div>
                  <SectionTitle>Pricing</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {(['Hourly','Flat','Visit fee'] as RateType[]).map(rt=>(
                      <button
                        key={rt}
                        type="button"
                        onClick={()=>set('rateType', rt)}
                        className={`px-3 py-1.5 rounded-lg border text-sm ${
                          form.rateType===rt ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>

                  {form.rateType==='Hourly' && (
                    <div className="mt-2" data-err="hourlyRate">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hourly rate *</label>
                      <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('hourlyRate')}`} value={form.hourlyRate} onChange={e=>set('hourlyRate', e.target.value)} placeholder="$120" />
                      {hintErr('hourlyRate')}
                    </div>
                  )}
                  {form.rateType==='Flat' && (
                    <div className="mt-2" data-err="flatMin">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Typical flat price *</label>
                      <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('flatMin')}`} value={form.flatMin} onChange={e=>set('flatMin', e.target.value)} placeholder="$600" />
                      {hintErr('flatMin')}
                    </div>
                  )}
                  {form.rateType==='Visit fee' && (
                    <div className="mt-2" data-err="visitFee">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visit/diagnostic fee *</label>
                      <input className={`w-full px-3 py-2 border rounded-md ${badgeErr('visitFee')}`} value={form.visitFee} onChange={e=>set('visitFee', e.target.value)} placeholder="$89" />
                      {hintErr('visitFee')}
                    </div>
                  )}

                  <label className="mt-2 flex items-center gap-2">
                    <input type="checkbox" checked={form.freeEstimates} onChange={e=>set('freeEstimates', e.target.checked)} />
                    Offer free estimates
                  </label>
                </div>

                <div>
                  <SectionTitle>Availability & Hours</SectionTitle>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.emergency} onChange={e=>set('emergency', e.target.checked)} />
                    Offer emergency service (after-hours / same-day)
                  </label>

                  <div className={`mt-3 rounded-xl border p-3 ${badgeErr('hours')}`} data-err="hours">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {DAYS.map((d)=>(
                        <div key={d} className="flex items-center gap-2 text-sm">
                          <label className="w-10">{d}</label>
                          <input type="checkbox" checked={form.hours[d].enabled} onChange={e=>setHours(d, { enabled: e.target.checked })} />
                          <input className="w-20 px-2 py-1 border rounded" value={form.hours[d].open} onChange={e=>setHours(d, { open: e.target.value })} placeholder="09:00" />
                          <span>–</span>
                          <input className="w-20 px-2 py-1 border rounded" value={form.hours[d].close} onChange={e=>setHours(d, { close: e.target.value })} placeholder="17:00" />
                        </div>
                      ))}
                    </div>
                    {hintErr('hours')}
                    <div className="mt-1 text-xs text-slate-500">Use 24-hour format (e.g., 08:30, 17:00). Uncheck to mark a day as closed.</div>
                  </div>
                </div>
              </div>
            )}

            {step==='review' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-semibold mb-2">Quick preview</div>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li><b>{form.businessName || 'Your business name'}</b> — {form.categories.join(', ') || 'No categories selected'}</li>
                    <li>{form.baseZip ? `Base ZIP ${form.baseZip}` : 'No base ZIP'} • Radius {form.radiusMiles} mi</li>
                    <li>Extra ZIPs: {form.extraZips.length ? form.extraZips.join(', ') : '—'}</li>
                    <li>License #{form.licenseNumber || '—'} • Ins: {form.insuranceCarrier || '—'}</li>
                    <li>Rate: {form.rateType} {form.rateType==='Hourly' ? form.hourlyRate : form.rateType==='Flat' ? form.flatMin : form.visitFee}</li>
                    <li>Specialties: {form.specialties.length ? form.specialties.join(', ') : '—'}</li>
                  </ul>
                </div>

                <div className="grid gap-2">
                  <label className="flex items-start gap-2 text-sm" data-err="agreeTerms">
                    <input type="checkbox" checked={form.agreeTerms} onChange={e=>set('agreeTerms', e.target.checked)} />
                    <span>I agree to the <a className="text-blue-600 underline" href="/terms" target="_blank">Terms</a> and <a className="text-blue-600 underline" href="/privacy" target="_blank">Privacy Policy</a>.
                      {errors.agreeTerms && <span className="block text-rose-600 text-xs">You must accept.</span>}
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-sm" data-err="certifyAccuracy">
                    <input type="checkbox" checked={form.certifyAccuracy} onChange={e=>set('certifyAccuracy', e.target.checked)} />
                    <span>I certify the information is accurate and I'm authorized to represent this business.
                      {errors.certifyAccuracy && <span className="block text-rose-600 text-xs">Please certify.</span>}
                    </span>
                  </label>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={busy || !form.agreeTerms || !form.certifyAccuracy}
                  >
                    {busy ? 'Submitting…' : 'Submit for review'}
                  </button>
                </div>
              </div>
            )}

            {/* Wizard footer nav */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
              {canBack && <button type="button" className="px-4 py-2 border rounded-md hover:bg-gray-50" onClick={prevStep}>Back</button>}
              {canNext && <button type="button" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={nextStep}>Next</button>}
              <span className="text-xs text-slate-500 ml-auto">We typically review new pros within 1–2 business days.</span>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

/* ====================== Utils ====================== */
function migrateDraft(v: any): Partial<FormDataT> {
  if (!v || typeof v !== 'object') return {}
  const asArr = (x: any): string[] =>
    Array.isArray(x) ? x.map(String) :
    typeof x === 'string' ? x.split(',').map(s=>s.trim()).filter(Boolean) : []

  return {
    ...v,
    extraZips: asArr(v.extraZips),
    specialties: asArr(v.specialties),
    categories: asArr(v.categories),
    payments: asArr(v.payments),
  }
}