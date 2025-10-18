'use client'

import React, { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Zap,
  MessageSquare,
  BarChart3,
  BellRing,
  Lock,
  MapPin,
  ArrowRight,
  BadgeCheck,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  Quote,
  CalendarDays,
  Users,
  LineChart,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react"

const BRAND_BLUE = "#2563EB"
const proText = "text-[var(--pro)]"
const proBg = "bg-[var(--pro)]"
const proRing = "focus-visible:ring-[var(--pro)]"

export default function SignalsPage() {
  return (
    <div className="relative min-h-screen overflow-clip bg-gray-50" style={{ '--pro': BRAND_BLUE } as React.CSSProperties}>
      <GradientMesh />
      <SignalsHero />
      <SignalsDemo />
      <HowSignalsWork />
      <SignalsMiniMap />
      <RuleBuilder />
      <WhySignalsWork />
      <SignalsComparison />
      <SignalsPricing />
      <SignalsCTA />
      <LocalKeyframes />
    </div>
  )
}

/* -------------------------------------------
   SIGNALS HERO - Enhanced from both versions
-------------------------------------------- */
function SignalsHero() {
  const [tab, setTab] = useState<"live" | "rules" | "alerts">("live")

  return (
    <section className="relative">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pt-16 pb-10 md:grid-cols-2 md:pt-24">
        {/* Left: Enhanced copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm ring-1 ring-blue-200 backdrop-blur"
          >
            ⚡ Rushr Pro • Real-time Signals
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-4 text-4xl font-black tracking-tight text-gray-900 md:text-6xl"
          >
            Win jobs before competitors even know they exist
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 max-w-xl text-lg text-gray-600"
          >
            Rushr Signals monitors permits, inspections, and violations in real-time. Get instant alerts when opportunities match your criteria—before they become public leads.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href="/sign-up">
              <Button size="lg" className={`${proBg} text-white ${proRing} hover:bg-[var(--pro)] hover:opacity-95`}>
                Start free alerts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--pro)] text-[var(--pro)] hover:bg-[color:rgb(37_99_235_/_0.08)] focus-visible:ring-[var(--pro)]"
              >
                See live demo
              </Button>
            </Link>
          </motion.div>

          <ul className="mt-6 grid max-w-lg grid-cols-2 gap-3 text-sm text-gray-700 sm:grid-cols-3">
            {[
              { icon: <Zap className="h-4 w-4" />, text: "Real-time alerts" },
              { icon: <MapPin className="h-4 w-4" />, text: "Precision targeting" },
              { icon: <Clock className="h-4 w-4" />, text: "2-min setup" },
              { icon: <BellRing className="h-4 w-4" />, text: "Multi-channel" },
              { icon: <Lock className="h-4 w-4" />, text: "Private to you" },
              { icon: <TrendingUp className="h-4 w-4" />, text: "Pay when you get paid" },
            ].map((b, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-blue-200/60 bg-white/80 px-3 py-2 backdrop-blur"
              >
                <span className={proText}>{b.icon}</span>
                {b.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Enhanced preview with tabs */}
        <div className="relative">
          <Card className="relative overflow-hidden border-blue-200/70 bg-white/80 shadow-xl backdrop-blur">
            <div className="flex items-center gap-2 border-b bg-white/70 px-3 py-2">
              {[
                { id: "live", label: "Live Feed" },
                { id: "rules", label: "Rules" },
                { id: "alerts", label: "Alerts" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as any)}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    tab === t.id ? `${proBg} font-semibold text-white` : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <CardContent className="relative p-4">
              {tab === "live" && <LiveSignalsPreview />}
              {tab === "rules" && <RulesPreview />}
              {tab === "alerts" && <AlertsPreview />}
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-blue-200/70" />
            </CardContent>
          </Card>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[color:rgb(37_99_235_/_0.12)] blur-3xl" />
        </div>
      </div>
    </section>
  )
}

function LiveSignalsPreview() {
  const signals = [
    { t: "Electrical permit filed", s: "Upper West Side • 1.2mi", m: "2m ago", type: "permit" },
    { t: "HVAC inspection failed", s: "Bushwick • 4.8mi", m: "9m ago", type: "inspection" },
    { t: "Plumbing violation posted", s: "Astoria • 2.3mi", m: "15m ago", type: "violation" },
  ]
  return (
    <div className="space-y-3">
      {signals.map((s, idx) => (
        <div key={idx} className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <div className="font-semibold text-gray-900">{s.t}</div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-500" />
              {s.s}
            </div>
          </div>
          <div className="text-right">
            <span className="rounded-full bg-[color:rgb(219_234_254)] px-2 py-1 text-xs font-semibold text-[color:rgb(37_99_235)]">
              {s.m}
            </span>
            <div className="mt-1 text-[10px] text-gray-500 capitalize">{s.type}</div>
          </div>
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between rounded-xl border bg-[color:rgb(219_234_254_/_0.6)] p-3">
        <div className="text-sm text-[color:rgb(30_64_175)]">Sign in to unlock full Signals in your area</div>
        <Lock className={proText + " h-4 w-4"} />
      </div>
    </div>
  )
}

function RulesPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Electrical Permits</div>
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Active</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">Brooklyn, Queens • Panel upgrades</div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">HVAC Inspections</div>
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Active</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">5-mile radius • Failed inspections</div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Plumbing Violations</div>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">Paused</span>
        </div>
        <div className="mt-2 text-sm text-gray-600">Manhattan • Water damage</div>
      </div>
    </div>
  )
}

function AlertsPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-blue-50 p-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">SMS Alert</span>
        </div>
        <div className="mt-2 text-sm text-blue-800">New electrical permit in your area. Tap to view details.</div>
      </div>
      <div className="rounded-xl border bg-green-50 p-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-900">Email Alert</span>
        </div>
        <div className="mt-2 text-sm text-green-800">Daily digest: 5 new signals match your rules</div>
      </div>
      <div className="rounded-xl border p-3">
        <div className="text-sm text-gray-600">Choose instant alerts, daily digest, or both</div>
      </div>
    </div>
  )
}

/* -------------------------------------------
   SIGNALS DEMO - Live interactive demo
-------------------------------------------- */
function SignalsDemo() {
  const [filter, setFilter] = useState("all")

  const demoSignals = [
    { id: 1, title: "Electrical permit filed", location: "Brooklyn, NY • 11215", time: "3m ago", type: "permit", scope: "Panel upgrade • 100A→200A", est: "$1.8k–$2.4k" },
    { id: 2, title: "HVAC inspection failed", location: "Queens, NY • 11354", time: "12m ago", type: "inspection", scope: "Condenser replacement", est: "$4.5k–$6.2k" },
    { id: 3, title: "Plumbing violation", location: "Manhattan, NY • 10001", time: "18m ago", type: "violation", scope: "Water pressure test", est: "$350–$600" },
    { id: 4, title: "Roofing permit", location: "Brooklyn, NY • 11206", time: "22m ago", type: "permit", scope: "Roof repair • Flashing", est: "$900–$1.4k" },
    { id: 5, title: "Gas line inspection", location: "Queens, NY • 11358", time: "33m ago", type: "inspection", scope: "Pressure test • Safety", est: "$450–$750" },
    { id: 6, title: "Electrical violation", location: "Manhattan, NY • 10003", time: "41m ago", type: "violation", scope: "Code compliance", est: "$1.2k–$2.1k" },
  ]

  const filteredSignals = filter === "all" ? demoSignals : demoSignals.filter(s => s.type === filter)

  return (
    <section id="demo" className="relative border-y bg-gradient-to-b from-white to-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">Live Signals demo</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <BellRing className={`${proText} h-4 w-4`} />
            <span>Real-time feed (preview)</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "all", label: "All Signals" },
            { id: "permit", label: "Permits" },
            { id: "inspection", label: "Inspections" },
            { id: "violation", label: "Violations" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === f.id
                  ? `${proBg} text-white`
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSignals.map((signal, i) => (
            <motion.div
              key={signal.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <Card className="group relative overflow-hidden border-gray-200 bg-white/70 shadow-sm backdrop-blur hover:shadow-md transition-shadow">
                <CardHeader className="relative">
                  <CardTitle className="flex items-center justify-between">
                    <span className="line-clamp-1 capitalize">{signal.title}</span>
                    <span className="rounded-full bg-[color:rgb(219_234_254)] px-2 py-1 text-xs font-semibold text-[color:rgb(37_99_235)]">
                      {signal.time}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{signal.location}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      signal.type === 'permit' ? 'bg-blue-100 text-blue-700' :
                      signal.type === 'inspection' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {signal.type}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border bg-white/70 p-3">
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">Scope: {signal.scope}</div>
                      <div className="mt-1">Est. price: {signal.est}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className={`${proBg} text-white flex-1`}>
                      Contact now
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Save lead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/sign-up">
            <Button size="lg" className={`${proBg} text-white ${proRing} hover:bg-[var(--pro)] hover:opacity-95`}>
              Start getting Signals
            </Button>
          </Link>
          <Link href="#rules">
            <Button
              size="lg"
              variant="outline"
              className="border-[var(--pro)] text-[var(--pro)] hover:bg-[color:rgb(37_99_235_/_0.08)] focus-visible:ring-[var(--pro)]"
            >
              Build your rules
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------
   HOW SIGNALS WORK - Step by step
-------------------------------------------- */
function HowSignalsWork() {
  const steps = [
    {
      n: 1,
      title: "We monitor everything",
      desc: "Real-time tracking of permits, inspections, licenses, and violations across your jurisdictions.",
      icon: <Zap className={`h-6 w-6 ${proText}`} />,
    },
    {
      n: 2,
      title: "You set the rules",
      desc: "Define exactly what you want: type, location, scope keywords, status, and more.",
      icon: <BarChart3 className={`h-6 w-6 ${proText}`} />,
    },
    {
      n: 3,
      title: "Instant alerts",
      desc: "Get notified the moment something matches—SMS, email, or in-app alerts.",
      icon: <BellRing className={`h-6 w-6 ${proText}`} />,
    },
    {
      n: 4,
      title: "Contact first",
      desc: "Reach out before it becomes a public lead. Win more with context and timing.",
      icon: <MessageSquare className={`h-6 w-6 ${proText}`} />,
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-gray-900">How Signals work</h2>
        <p className="mt-2 text-gray-600">Be first to every opportunity in your market</p>
      </div>
      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <TiltCard key={i}>
            <Card className="relative h-full min-h-[280px] overflow-hidden border-blue-200/60 bg-white/80 shadow-sm backdrop-blur text-center flex flex-col">
              <GradientBorder />
              <CardHeader className="flex flex-col items-center flex-shrink-0">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[color:rgb(239_246_255)] ring-1 ring-[color:rgb(191_219_254)]">
                    {s.icon}
                  </div>
                  <div className={`absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full ${proBg} shadow-lg ring-2 ring-white`}>
                    <span className="text-sm font-bold text-white">{s.n}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-gray-900 text-lg font-semibold text-center min-h-[3rem] flex items-center justify-center">
                    {s.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pb-6 text-center flex-1 flex items-center justify-center">
                <p className="text-gray-600">{s.desc}</p>
              </CardContent>
            </Card>
          </TiltCard>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------
   SIGNALS MINI MAP - From original pro homepage
-------------------------------------------- */
function SignalsMiniMap() {
  const [radiusMi, setRadiusMi] = useState(35)

  const pins = [
    { left: 18, top: 24, title: "Electrical permit filed", meta: "Upper West Side • Panel upgrade", time: "3m" },
    { left: 42, top: 62, title: "DOB violation posted", meta: "Bushwick • Reinspection", time: "11m" },
    { left: 70, top: 38, title: "Plumbing rough-in", meta: "Astoria • 2-bath layout", time: "16m" },
    { left: 60, top: 18, title: "HVAC replacement", meta: "LIC • 3-ton condenser", time: "27m" },
    { left: 34, top: 48, title: "Roofing repair", meta: "Greenpoint • Flashing", time: "31m" },
    { left: 52, top: 35, title: "Gas line inspection", meta: "Williamsburg • Pressure test", time: "42m" },
  ]

  const radiusPct = useMemo(() => {
    const pct = 8 + Math.min(100, Math.max(1, radiusMi)) * 0.37
    return Math.min(45, Math.max(8, pct))
  }, [radiusMi])

  const visiblePins = useMemo(() => {
    return pins.filter((p) => {
      const dx = p.left - 50
      const dy = p.top - 50
      const dist = Math.sqrt(dx * dx + dy * dy)
      return dist <= radiusPct
    })
  }, [radiusPct])

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h2 className="text-3xl font-semibold text-gray-900">Precision targeting</h2>
        <p className="mt-2 text-gray-600">Set custom radius, jurisdictions, and keywords. Get exactly the Signals you want—nothing more, nothing less.</p>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-2">
        {/* Left side: Slider + Signals list */}
        <div className="space-y-6">
          {/* Slider controls moved to left side */}
          <div>
            <label className="block text-sm text-gray-700">Radius: {radiusMi} miles</label>
            <input
              type="range"
              min={1}
              max={100}
              value={radiusMi}
              onChange={(e) => setRadiusMi(parseInt(e.target.value))}
              className="mt-2 w-full"
              style={{ accentColor: "var(--pro)" }}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-gray-700">
                <Globe className={`${proText} h-4 w-4`} />
                Multi-jurisdiction
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-gray-700">
                <MapPin className={`${proText} h-4 w-4`} />
                ZIP targeting
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-3 py-2 text-gray-700">
                <BellRing className={`${proText} h-4 w-4`} />
                {radiusMi} mile radius
              </span>
            </div>
          </div>

          {/* Signals list below slider */}
          <div className="rounded-xl border bg-white/85 p-4">
            <div className="mb-3 text-lg font-semibold text-gray-800">Signals in radius: {visiblePins.length}</div>
            {visiblePins.length === 0 ? (
              <div className="text-sm text-gray-600">No signals in this radius. Increase the radius to see more.</div>
            ) : (
              <ul className="space-y-2 text-sm">
                {visiblePins.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-white/70 p-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className={`${proText} h-4 w-4 shrink-0`} />
                      <span className="truncate font-medium text-gray-900">{p.title}</span>
                      <span className="hidden shrink-0 text-gray-500 sm:inline">•</span>
                      <span className="hidden truncate text-gray-600 sm:inline">{p.meta}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-[color:rgb(219_234_254)] px-2 py-1 text-[11px] font-semibold text-[color:rgb(37_99_235)]">
                      {p.time} ago
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Revenue Calculator */}
          <div className="rounded-xl border bg-white/85 p-4">
            <div className="mb-3 text-center">
              <div className="text-sm font-semibold text-gray-800">💰 Revenue Calculator</div>
              <div className="text-xs text-gray-600">Estimate your monthly potential</div>
            </div>
            <RevenueCalculator />
          </div>
        </div>

        {/* Right side: Mini map */}
        <div className="relative">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border bg-[radial-gradient(1200px_600px_at_70%_-20%,rgba(59,130,246,0.12),transparent),radial-gradient(1000px_400px_at_-10%_120%,rgba(16,185,129,0.10),transparent)]">
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)", backgroundSize: "22px 22px" }}
            />
            <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[40%] rounded-full bg-[color:rgb(147_197_253_/_0.25)] blur-2xl" />
            <div className="absolute left-[10%] bottom-[8%] h-[22%] w-[30%] rounded-[30%] bg-[color:rgb(110_231_183_/_0.28)] blur-xl" />

            <div
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:rgb(37_99_235_/_0.28)]"
              style={{ width: `${radiusPct * 2}%`, height: `${radiusPct * 2}%` }}
            />

            {[...visiblePins].map((p, i) => (
              <div
                key={i}
                className="absolute"
                style={{ left: `${p.left}%`, top: `${p.top}%`, transform: "translate(-50%, -50%)" }}
                title={`${p.title} — ${p.meta}`}
              >
                <span className="relative block">
                  <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-[color:rgb(96_165_250_/_0.30)]" />
                  <span className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[color:rgb(59_130_246_/_0.45)]" />
                  <span className="relative z-10 inline-flex h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--pro)] ring-2 ring-white" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------
   RULE BUILDER - Interactive demo
-------------------------------------------- */
function RuleBuilder() {
  const [rule, setRule] = useState({
    type: '',
    jurisdiction: '',
    scope: '',
    delivery: ''
  })

  const options = {
    type: ['Permit: Filed', 'Inspection: Failed', 'Violation: Posted', 'License: Renewed'],
    jurisdiction: ['Brooklyn, NY', 'Queens, NY', 'Manhattan, NY', 'Nassau County, NY'],
    scope: ['Panel upgrade', 'HVAC replacement', 'Roof repair', 'Plumbing'],
    delivery: ['Instant SMS + Email', 'Email only', 'Daily digest']
  }

  return (
    <section id="rules" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Build your rules</h2>
        <p className="mt-2 text-gray-600">Point and click to create precise Signals rules</p>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-8">
        {/* Rule builder */}
        <Card className="p-6">
          <div className="space-y-4">
            {Object.entries(options).map(([key, values]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{key}</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                  value={(rule as any)[key]}
                  onChange={(e) => setRule(r => ({ ...r, [key]: e.target.value }))}
                >
                  <option value="">Select {key}...</option>
                  {values.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="pt-4">
              <Button className={`${proBg} text-white w-full`}>
                Create rule
              </Button>
              <p className="mt-2 text-xs text-gray-500">Demo only—sign up to save rules</p>
            </div>
          </div>
        </Card>

        {/* Rule preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rule preview</h3>
          {Object.values(rule).some(v => v) ? (
            <div className="space-y-3">
              {Object.entries(rule).filter(([, v]) => v).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                    <span className="font-semibold capitalize">{key}:</span> {value}
                  </span>
                </div>
              ))}
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  ✓ This rule will alert you when matching signals are detected
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select options above to preview your rule</p>
          )}
        </Card>
      </div>
    </section>
  )
}

/* -------------------------------------------
   WHY SIGNALS WORK
-------------------------------------------- */
function WhySignalsWork() {
  const benefits = [
    { title: "Be first to respond", desc: "Contact prospects before they become public leads", stat: "3x faster response" },
    { title: "Higher close rates", desc: "Win more when you're first in the door", stat: "+40% close rate" },
    { title: "No competition", desc: "Private alerts mean no bidding wars", stat: "Zero competitors" },
    { title: "Perfect timing", desc: "Reach out when they need you most", stat: "Real-time alerts" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Why Signals work</h2>
        <p className="mt-2 text-gray-600">The competitive advantage of timing and precision</p>
      </div>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map((benefit, i) => (
          <Card key={i} className="border-blue-200/60 bg-white/85 shadow-sm text-center p-6">
            <CardContent className="pt-6 flex flex-col flex-1">
              <div className={`text-2xl font-bold ${proText} mb-2`}>{benefit.stat}</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</div>
              <p className="text-sm text-gray-600">{benefit.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------------------
   SIGNALS COMPARISON
-------------------------------------------- */
function SignalsComparison() {
  const rows = [
    { label: "Timing", signals: "Real-time alerts", traditional: "After they post publicly" },
    { label: "Competition", signals: "Private to you", traditional: "Sold to multiple pros" },
    { label: "Targeting", signals: "Precise rules & filters", traditional: "Broad categories only" },
    { label: "Context", signals: "Full permit/inspection details", traditional: "Basic homeowner request" },
    { label: "Pricing", signals: "Low monthly add-on", traditional: "Pay per lead" },
  ]

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Signals vs traditional leads</h2>
        <p className="mt-2 text-gray-600">Why timing beats everything else</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border bg-white/85 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[color:rgb(219_234_254_/_0.6)] text-gray-800">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold">Feature</th>
              <th className="px-6 py-4 text-sm font-semibold">Rushr Signals</th>
              <th className="px-6 py-4 text-sm font-semibold">Traditional leads</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-6 py-4 font-medium text-gray-900">{r.label}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 ${proText}`}>
                    <CheckCircle className="h-5 w-5" /> {r.signals}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-gray-500">
                    <XCircle className="h-5 w-5" /> {r.traditional}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* -------------------------------------------
   SIGNALS PRICING
-------------------------------------------- */
function SignalsPricing() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Signals pricing</h2>
        <p className="mt-2 text-gray-600">Start with the free platform, then add Signals when you're ready for more leads.</p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        <Card className="p-6 border-blue-200 ring-2 ring-blue-100 relative flex flex-col">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Always Free</span>
          </div>
          <CardContent className="pt-6 flex flex-col flex-1">
            <h3 className="text-xl font-semibold text-gray-900">Rushr Pro Platform</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">Free<span className="text-lg font-normal text-gray-500"> forever</span></p>
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">Success fee: 3% only when jobs close</p>
              <p className="text-xs text-green-700 mt-1">You make $1,000 → you pay $30. You make $0 → you pay $0.</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 flex-1">
              <li>• Complete job management platform</li>
              <li>• Customer communication tools</li>
              <li>• Professional invoicing & payments</li>
              <li>• Review management</li>
              <li>• Team collaboration</li>
              <li>• Business analytics</li>
            </ul>
            <div className="mt-6">
              <Button className="bg-green-600 hover:bg-green-700 text-white w-full">Get started free</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-blue-200 flex flex-col">
          <CardContent className="pt-6 flex flex-col flex-1">
            <h3 className="text-xl font-semibold text-gray-900">+ Signals Add-on</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">$299<span className="text-lg font-normal text-gray-500">/month</span></p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Premium lead generation + 3% success fee</p>
              <p className="text-xs text-blue-700 mt-1">Get leads before competitors + pay when jobs close</p>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 flex-1">
              <li>• Everything in Free Platform</li>
              <li>• Real-time permit/inspection monitoring</li>
              <li>• Unlimited custom rules</li>
              <li>• Instant SMS + email alerts</li>
              <li>• Multi-jurisdiction coverage</li>
              <li>• Priority support</li>
            </ul>
            <div className="mt-6">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Add Signals</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">Questions about pricing? <Link href="/contact" className="text-blue-600 hover:underline">Let's talk</Link></p>
      </div>
    </section>
  )
}

/* -------------------------------------------
   SIGNALS CTA
-------------------------------------------- */
function SignalsCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="rounded-2xl bg-blue-600 text-white p-8 md:p-12 text-center shadow-xl">
        <h2 className="text-3xl font-bold">Own the first call in your market</h2>
        <p className="text-blue-100 mt-4 text-lg max-w-2xl mx-auto">
          Turn permits and inspections into booked jobs. Free platform + success fees only. Risk nothing.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
              Get started free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              See demo again
            </Button>
          </Link>
        </div>
        <div className="mt-6 text-sm text-blue-100">
          Free forever platform • Pay only when you get paid • Cancel Signals anytime
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------
   Helper components
-------------------------------------------- */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useTransform(y, [-50, 50], [8, -8])
  const ry = useTransform(x, [-50, 50], [-8, 8])
  const rxs = useSpring(rx, { stiffness: 120, damping: 12 })
  const rys = useSpring(ry, { stiffness: 120, damping: 12 })

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = e.clientX - rect.left - rect.width / 2
    const py = e.clientY - rect.top - rect.height / 2
    x.set(px / 6)
    y.set(py / 6)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{ rotateX: rxs, rotateY: rys, transformStyle: "preserve-3d" }}
      className="will-change-transform"
    >
      <div style={{ transform: "translateZ(0)" }}>{children}</div>
    </motion.div>
  )
}

function GradientMesh() {
  return (
    <div aria-hidden className="fixed inset-0 -z-20">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-emerald-50/40" />
      <svg className="absolute inset-x-0 top-[-180px] -z-10 h-[560px] w-full opacity-50" viewBox="0 0 1155 678" preserveAspectRatio="none">
        <path
          fill="url(#mesh)"
          fillOpacity=".8"
          d="M317.219 518.975L203.852 678 0 451.106l317.219 67.869 204.172-247.652c0 0 73.631-24.85 140.579 20.38 66.948 45.23 161.139 167.81 161.139 167.81l-507.89 59.462z"
        />
        <defs>
          <linearGradient id="mesh" x1="0" x2="1" y1="1" y2="0">
            <stop stopColor="#dbeafe" />
            <stop offset="1" stopColor="#dcfce7" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #000 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
    </div>
  )
}

function GradientBorder() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition group-hover:opacity-100"
      style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.25), 0 8px 28px -12px rgba(59,130,246,0.35)" }}
    />
  )
}

function RevenueCalculator() {
  const [leads, setLeads] = useState(25)
  const [closeRate, setCloseRate] = useState(30)
  const [avgJob, setAvgJob] = useState(1200)
  const [margin, setMargin] = useState(40)
  const monthlyRevenue = leads * (closeRate/100) * avgJob
  const monthlyProfit = monthlyRevenue * (margin/100)

  return (
    <div className="space-y-3">
      <CalcRow label={`Leads/mo: ${leads}`}>
        <input
          aria-label="Leads per month"
          type="range"
          min={5}
          max={80}
          value={leads}
          onChange={e=>setLeads(+e.target.value)}
          className="w-full accent-blue-500"
        />
      </CalcRow>
      <CalcRow label={`Close rate: ${closeRate}%`}>
        <input
          aria-label="Close rate"
          type="range"
          min={10}
          max={60}
          step={1}
          value={closeRate}
          onChange={e=>setCloseRate(+e.target.value)}
          className="w-full accent-blue-500"
        />
      </CalcRow>
      <CalcRow label={`Avg job: $${avgJob}`}>
        <input
          aria-label="Average job value"
          type="range"
          min={200}
          max={5000}
          step={50}
          value={avgJob}
          onChange={e=>setAvgJob(+e.target.value)}
          className="w-full accent-blue-500"
        />
      </CalcRow>
      <CalcRow label={`Margin: ${margin}%`}>
        <input
          aria-label="Margin"
          type="range"
          min={15}
          max={65}
          step={1}
          value={margin}
          onChange={e=>setMargin(+e.target.value)}
          className="w-full accent-blue-500"
        />
      </CalcRow>
      <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-900 border border-blue-200">
        <div><span className="font-semibold">Est. monthly revenue:</span> ${Math.round(monthlyRevenue).toLocaleString()}</div>
        <div><span className="font-semibold">Est. monthly profit:</span> ${Math.round(monthlyProfit).toLocaleString()}</div>
      </div>
    </div>
  )
}

function CalcRow({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </div>
  )
}

function LocalKeyframes() {
  return (
    <style>{`
      :root { --pro: ${BRAND_BLUE}; }
      @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
      .animate-shimmer { animation: shimmer 1.6s linear infinite }
    `}</style>
  )
}
