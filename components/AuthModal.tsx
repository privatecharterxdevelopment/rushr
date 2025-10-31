"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useAuth } from "../contexts/AuthContext"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

type Mode = "signin" // AuthModal is LOGIN ONLY now

// allow passing a callbackUrl with the event so we can return the user
type OpenDetail = { mode?: Mode; callbackUrl?: string }

// export that can be called anywhere (supports callbackUrl) - LOGIN ONLY
export function openAuth(callbackUrl?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<OpenDetail>("auth:open", { detail: { mode: "signin", callbackUrl } }))
  }
}

export default function AuthModal() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const mode = "signin" as const // LOGIN ONLY

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { signIn } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const pathname = usePathname()

  // where to send the user after successful auth
  const callbackRef = useRef<string | undefined>(undefined)

  // Detect if we're on a pro route for styling
  const isProRoute = pathname?.startsWith('/pro') || false

  useEffect(() => setMounted(true), [])

  // 🔔 open when someone calls openAuth()
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenDetail>).detail
      callbackRef.current = detail?.callbackUrl
      setOpen(true)
      setError(null)
      setLoading(false)
      // AuthModal is only for homeowners - contractors use /pro/contractor-signup
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("auth:open", onOpen as any)
    window.addEventListener("keydown", onEsc)
    return () => {
      window.removeEventListener("auth:open", onOpen as any)
      window.removeEventListener("keydown", onEsc)
    }
  }, [])

  // 🔗 ALSO auto-open if URL has ?auth=signin (& optional ?callback=/some/path)
  useEffect(() => {
    const a = params.get("auth")
    const cb = params.get("callback") || undefined
    if (a === "signin" && !open) {
      callbackRef.current = cb
      setOpen(true)
    }
  }, [params, open])

  // Clean up ?auth / ?callback in the URL when closing
  const cleanUrl = () => {
    const hasAuth = params.get("auth")
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
      const passTrim = password.trim()

      if (!emailTrim || !passTrim) {
        setError("Please enter your email and password.")
        setLoading(false)
        return
      }

      // AuthModal is LOGIN ONLY - Sign in with Supabase
      const result = await signIn(emailTrim, passTrim)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (result.success) {
        setSuccess(true)
        setLoading(false)
        // Show success for 1.5 seconds then close
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
          cleanUrl()
          // Clear form
          setEmail("")
          setPassword("")
          setError(null)
          const target = callbackRef.current || "/dashboard/homeowner"
          router.push(target)
          // Let AuthContext handle routing via auth state change
        }, 1500)
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (!mounted) return null
  if (!open) return null

  const title = success ? "Success!" : "Sign in to your account"
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
            For homeowners. New? <a href="/sign-up" className="text-emerald-600 hover:text-emerald-700 font-medium">Create account</a> | Service providers <a href="/pro/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">sign in here</a>.
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Welcome back!
            </h3>
            <p className="text-sm text-slate-600">
              Redirecting to your dashboard...
            </p>
            <div className="mt-4 inline-flex items-center text-sm text-emerald-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
              className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none ${isProRoute ? 'focus:border-blue-500' : 'focus:border-emerald-500'
                }`}
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px] outline-none ${isProRoute ? 'focus:border-blue-500' : 'focus:border-emerald-500'
                }`}
            />
            {error && (
              <div className="text-sm text-rose-600">
                {error.includes('contractor account') ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
                    <p className="font-medium mb-2">🔵 Contractor Account Detected</p>
                    <p className="text-sm mb-2">{error}</p>
                    <a
                      href="/pro/sign-in"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Go to Contractor Login →
                    </a>
                  </div>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl px-3 py-2 text-[14px] font-semibold text-white disabled:opacity-60 flex items-center justify-center ${isProRoute
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
