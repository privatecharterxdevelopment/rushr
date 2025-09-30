'use client'

import React, { useMemo, useState } from 'react'
import { useApp } from '../../lib/state' // optional: only used to prefill name if available
import Link from "next/link";

export default function ContactPage() {
  const { state } = useApp() as any // safe even if undefined initially
  const prefillName = useMemo(() => state?.user?.name || '', [state?.user?.name])

  const [name, setName] = useState(prefillName)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Homeowner' | 'Contractor' | 'Other'>('Homeowner')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [agree, setAgree] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // simple client validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('Please fill in all required fields.')
      return
    }
    if (!agree) {
      setError('Please agree to be contacted.')
      return
    }

    setSubmitting(true)
    try {
      // Try API route (ok to remove; page still works without)
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, subject, message }),
      })

      if (!res.ok) throw new Error(String(res.status || 'Request failed'))

      setSuccess(true)
    } catch {
      // Fallback: open mailto with prefilled body
      const lines = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Role: ${role}`,
        `Subject: ${subject}`,
        '',
        message,
      ]
      const mailto = `mailto:hello@userushr.com?subject=${encodeURIComponent(
        `[Contact] ${subject}`
      )}&body=${encodeURIComponent(lines.join('\n'))}`

      // Open in a new tab so we keep success state here
      window.open(mailto, '_blank', 'noopener,noreferrer')
      setSuccess(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <main className="container-max py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 md:p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <IconCheck className="h-6 w-6 text-emerald-700" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Message sent</h1>
          <p className="mt-2 text-sm text-slate-600">
            Thanks for reaching out. We will follow up at <span className="font-medium">{email || 'your email'}</span> shortly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/" className="btn btn-outline">Back to home</Link>
            <Link href="/messages" className="btn-primary">Open messages</Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      {/* Top banner */}
      <section className="border-b bg-gradient-to-br from-emerald-50 via-emerald-100 to-white">
        <div className="container-max py-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
              <IconSparkle className="h-4 w-4 text-primary" />
              We are here to help
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">
              Contact Rushr
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Questions about quotes, accounts, or Signals? Send us a note and we will get right back.
            </p>
          </div>
        </div>
      </section>

      {/* Grid: form + quick help */}
      <section className="container-max py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
          {/* Form card */}
          <div className="rounded-2xl border bg-white p-6 md:p-8">
            <div className="mb-4 flex items-center gap-2">
              <IconMail className="h-5 w-5 text-emerald-700" />
              <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>
            </div>

            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Your name"
                  required
                  input={
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  }
                />
                <Field
                  label="Email"
                  required
                  input={
                    <input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="I am a"
                  input={
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value as any)}
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      <option>Homeowner</option>
                      <option>Contractor</option>
                      <option>Other</option>
                    </select>
                  }
                />
                <Field
                  label="Subject"
                  required
                  input={
                    <input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Account question, quoting help, Signals, etc."
                      className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  }
                />
              </div>

              <Field
                label="Message"
                required
                input={
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                    rows={6}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                }
              />

              <label className="mt-2 flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  className="mt-[3px] h-4 w-4 rounded border-slate-300 text-primary focus:ring-emerald-200"
                />
                <span>
                  I agree to be contacted about my request. Rushr will use this information to respond and provide support.
                </span>
              </label>

              {error && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Send message'}
                </button>
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Open messages
                </Link>
              </div>
            </form>
          </div>

          {/* Quick help / contact options */}
          <aside className="space-y-4">
            <div className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5 text-emerald-700" />
                <div className="text-sm font-semibold text-slate-900">Response time</div>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                We usually reply within a few hours on business days.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Badge icon={<IconMessage className="h-4 w-4" />}>Chat in Messages</Badge>
                <Badge icon={<IconShieldCheck className="h-4 w-4" />}>Account & quoting help</Badge>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-2">
                <IconBook className="h-5 w-5 text-emerald-700" />
                <div className="text-sm font-semibold text-slate-900">Helpful links</div>
              </div>
              <ul className="mt-2 space-y-2 text-sm">
                <li><Link className="text-emerald-700 hover:text-emerald-800" href="/how-it-works">How it works</Link></li>
                <li><Link className="text-emerald-700 hover:text-emerald-800" href="/signals">About Signals</Link></li>
                <li><Link className="text-emerald-700 hover:text-emerald-800" href="/pricing">Pricing</Link></li>
                <li><Link className="text-emerald-700 hover:text-emerald-800" href="/about#faq">FAQ</Link></li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-white p-5">
              <div className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5 text-emerald-700" />
                <div className="text-sm font-semibold text-slate-900">Prefer email</div>
              </div>
              <p className="mt-1 text-sm text-slate-600">hello@userushr.com</p>
              <a
                href="mailto:hello@userushr.com"
                className="mt-3 inline-flex items-center justify-center rounded-md border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Email us
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

/* ------------------------ Small composables ------------------------ */
function Field({ label, required, input }: { label: string; required?: boolean; input: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {input}
    </label>
  )
}
function Badge({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-medium text-emerald-700">
      {icon}
      <span className="truncate">{children}</span>
    </div>
  )
}

/* ---------------------------- Inline icons ---------------------------- */
function IconCheck(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M20 6L9 17l-5-5"/></svg>)
}
function IconSparkle(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5zM5 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zM19 12l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"/></svg>)
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M3 7l9 6 9-6"/></svg>)
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><circle cx="12" cy="12" r="9" strokeWidth="2"/><path strokeWidth="2" d="M12 7v5l3 2"/></svg>)
}
function IconMessage(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>)
}
function IconShieldCheck(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M12 3l8 4v5c0 5-3.4 8.6-8 9-4.6-.4-8-4-8-9V7l8-4z"/><path strokeWidth="2" d="M9 12l2 2 4-4"/></svg>)
}
function IconBook(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" d="M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a1 1 0 0 1-1 1H7a3 3 0 0 0-3 3z"/></svg>)
}
function IconMapPin(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5" strokeWidth="2"/></svg>)
}