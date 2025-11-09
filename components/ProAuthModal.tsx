"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useProAuth } from "../contexts/ProAuthContext"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

type Mode = "signin" // ProAuthModal is LOGIN ONLY for contractors

// allow passing a callbackUrl with the event so we can return the user
type OpenDetail = { mode?: Mode; callbackUrl?: string }

// export that can be called anywhere (supports callbackUrl) - LOGIN ONLY
export function openProAuth(callbackUrl?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<OpenDetail>("proauth:open", { detail: { mode: "signin", callbackUrl } }))
  }
}

export default function ProAuthModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const mode = "signin" as const // LOGIN ONLY

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { signIn } = useProAuth()
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()

  // where to send the user after successful auth
  const callbackRef = useRef<string | undefined>(undefined)

  useEffect(() => setMounted(true), [])

  // 🔔 open when someone calls openProAuth()
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenDetail>).detail
      callbackRef.current = detail?.callbackUrl
      setOpen(true)
      setError(null)
      setLoading(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("proauth:open", onOpen as any)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("proauth:open", onOpen as any)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  // URL parameter auto-open DISABLED to allow browsing Pro page without modal
  // Modal now only opens when user explicitly clicks "Sign In" button
  // If you need URL-based auto-open in future, add back the useEffect below

  // Clean up ?proauth / ?callback in the URL when closing
  const cleanUrl = () => {
    const hasAuth = params.get("proauth")
    const hasCb = params.get("callback")
    if (hasAuth || hasCb) {
      router.replace(window.location.pathname, { scroll: false })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      const emailTrim = email.trim().toLowerCase()
      const passTrim  = password.trim()

      if (!emailTrim || !passTrim) {
        setError("Please enter your email and password.")
        setLoading(false)
        return
      }

      // ProAuthModal is LOGIN ONLY - Sign in with Supabase for contractors
      const result = await signIn(emailTrim, passTrim)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.success) {
        setSuccess(true)
        setLoading(false)
        // Show success for 1 second then redirect to contractor dashboard
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          cleanUrl()
          // Clear form
          setEmail("")
          setPassword("")
          setError(null)
          // Redirect to contractor dashboard
          window.location.href = '/dashboard/contractor'
        }, 1000)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!mounted) return null
  if (!open) return null

  const title = success ? "Success!" : "Sign in as a Pro"
  const cta = success
    ? "Redirecting..."
    : loading
      ? "Signing in..."
      : "Sign in"

  return createPortal(
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      {/* overlay */}
      <button
        aria-label="Close"
        className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[1px]"
        onClick={() => { setOpen(false); cleanUrl() }}
      />
      {/* modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              onClick={() => { setOpen(false); cleanUrl() }}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-600">
            For service professionals. New? <a href="/pro/contractor-signup" className="text-blue-600 hover:text-blue-700 font-medium">Create account</a> | Homeowners <a href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">go here</a>.
          </p>
        </div>

        {/* Socials (disabled for now) */}
        <div className="mb-3 grid gap-2">
          <button type="button" disabled className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-500 opacity-60" title="Coming soon">
            Continue with Google
          </button>
          <button type="button" disabled className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-500 opacity-60" title="Coming soon">
            Continue with Apple
          </button>
        </div>

        <div className="my-3 h-px bg-slate-200" />

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Welcome back!
            </h3>
            <p className="text-sm text-slate-600">
              Redirecting to your dashboard...
            </p>
            <div className="mt-4 inline-flex items-center text-sm text-blue-600">
              <img
                src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                alt="Loading..."
                className="w-4 h-4 object-contain -ml-1 mr-2"
              />
              Redirecting...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-blue-500"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-blue-500"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-60 flex items-center justify-center"
            >
              {loading && (
                <img
                  src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                  alt="Loading..."
                  className="w-4 h-4 object-contain -ml-1 mr-2"
                />
              )}
              {cta}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  )
}
