'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuth } from '../../../contexts/AuthContext'
import { showGlobalToast } from '../../../components/Toast'
import { useRouter } from 'next/navigation'
import {
  Zap,
  Shield,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  MapPin,
  Camera,
  CreditCard,
  Users,
  Phone,
  Home,
  Car,
  Wrench,
  AlertTriangle,
  ChevronRight,
  PlayCircle,
  DollarSign,
  TrendingUp,
  Target,
  Bell,
  Briefcase,
  Award,
  Search,
  Building,
  FileText,
  Hammer
} from 'lucide-react'

const PRO_BLUE = '#2563EB'

export default function HowItWorksForProsPage(){
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [revenueValue, setRevenueValue] = useState(75000)

  const go = (href:string)=>{
    if(!user && !loading){
      showGlobalToast('Sign in to continue', 'info')
      router.push('/auth')
      return
    }
    router.push(href)
  }


  return (
    <div className="relative min-h-screen bg-gray-50" style={{ '--pro': PRO_BLUE } as React.CSSProperties}>
      <GradientMesh />

      {/* Hero Section */}
      <HeroSection go={go} />

      {/* Interactive Process */}
      <ProcessSection
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        go={go}
      />

      {/* Revenue Calculator */}
      <RevenueSection
        revenueValue={revenueValue}
        setRevenueValue={setRevenueValue}
        go={go}
      />

      {/* Profile Builder */}
      <ProfileBuilderSection />

      {/* Signals Integration */}
      <SignalsSection go={go} />

      {/* Why Contractors Choose Rushr */}
      <WhyContractorsSection />

      {/* Success Stories */}
      <SuccessStoriesSection />

      {/* Final CTA */}
      <FinalCTASection go={go} />
    </div>
  )
}

// Gradient background mesh
function GradientMesh() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -inset-10 opacity-50">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
    </div>
  )
}

// Hero Section
function HeroSection({ go }: { go: (href: string) => void }) {
  return (
    <section className="relative pt-12 pb-8 overflow-hidden">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium mb-4"
          >
            <Briefcase className="w-3 h-3" />
            Professional Growth Platform
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 leading-tight mb-4"
          >
            From Alert
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              to Income
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed"
          >
            Transform emergency alerts into steady income. Join thousands of contractors earning more with Rushr's intelligent job matching and Signals technology.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => go('/jobs')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Start Finding Jobs Now
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/signals"
                className="bg-white hover:bg-gray-50 text-blue-700 hover:text-blue-800 px-6 py-3 rounded-xl font-semibold shadow-lg border border-blue-200 hover:border-blue-300 transition-all flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Explore Signals
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-xl mx-auto"
          >
            <StatCard icon={DollarSign} value="$75k+" label="Average Annual Revenue" />
            <StatCard icon={Clock} value="2-5 min" label="Job Response Time" />
            <StatCard icon={TrendingUp} value="3x" label="More Jobs Found" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Process Section with Interactive Steps
function ProcessSection({
  activeStep,
  setActiveStep,
  go
}: {
  activeStep: number
  setActiveStep: (step: number) => void
  go: (href: string) => void
}) {
  const steps = [
    {
      number: 1,
      title: "Set Up Your Profile",
      description: "Create a winning profile with your services, credentials, and service area. Upload licensing and insurance for trust badges.",
      icon: Building,
      color: "blue",
      details: ["Add specialties & rates", "Upload license/insurance", "Set service radius", "Add portfolio photos"],
      cta: { text: "Complete Profile", action: () => go('/settings') }
    },
    {
      number: 2,
      title: "Get Smart Alerts",
      description: "Turn on Signals to receive instant notifications for emergency jobs and inspection failures in your area before they're posted.",
      icon: Bell,
      color: "blue",
      details: ["Instant job notifications", "Signals early alerts", "Custom rule filtering", "Real-time opportunities"],
      cta: { text: "Setup Signals", action: () => go('/signals') }
    },
    {
      number: 3,
      title: "Bid & Win Jobs",
      description: "Respond quickly with professional quotes. Use templates and line items to win more contracts with competitive, detailed bids.",
      icon: Target,
      color: "blue",
      details: ["Quick bid templates", "Detailed line items", "Photo attachments", "Emergency availability"],
      cta: { text: "Browse Jobs", action: () => go('/jobs') }
    },
    {
      number: 4,
      title: "Deliver & Grow",
      description: "Complete jobs, earn reviews, and build your reputation. Use 1-click rehire to secure repeat customers and steady income.",
      icon: TrendingUp,
      color: "blue",
      details: ["Track job progress", "Secure payments", "Earn 5-star reviews", "1-click rehire"],
      cta: { text: "View Dashboard", action: () => go('/dashboard') }
    }
  ]

  return (
    <section className="py-20">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            How Contractors Build Income with Rushr
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            From setup to success in four proven steps
          </p>

        </motion.div>

        {/* Interactive Steps */}
        <div className="grid lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <ProProcessStepCard
              key={step.number}
              step={step}
              isActive={activeStep === index}
              onClick={() => setActiveStep(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Pro Process Step Card Component
function ProProcessStepCard({
  step,
  isActive,
  onClick,
  index
}: {
  step: any
  isActive: boolean
  onClick: () => void
  index: number
}) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-300 ${
        isActive
          ? 'transform scale-105'
          : 'hover:transform hover:scale-102'
      }`}
    >
      <div className={`rounded-3xl p-6 transition-all duration-300 ${
        isActive
          ? 'bg-blue-50 border-2 border-blue-200 shadow-xl'
          : 'bg-white border border-slate-200 shadow-lg hover:shadow-xl'
      }`}>
        {/* Step Number & Icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {step.number}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 text-slate-600'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {step.title}
        </h3>
        <p className="text-slate-600 mb-4 text-sm leading-relaxed">
          {step.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-6">
          {step.details.map((detail: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle className={`w-3 h-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {detail}
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation()
            step.cta.action()
          }}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {step.cta.text}
        </motion.button>
      </div>
    </motion.div>
  )
}

// Revenue Calculator Section
function RevenueSection({
  revenueValue,
  setRevenueValue,
  go
}: {
  revenueValue: number
  setRevenueValue: (value: number) => void
  go: (href: string) => void
}) {
  const monthlyRevenue = Math.round(revenueValue / 12)
  const weeklyJobs = Math.round(revenueValue / 52 / 250) // Assuming $250 average job
  const signalsBoost = Math.round(revenueValue * 0.3) // 30% boost with Signals

  return (
    <section className="py-20 bg-blue-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Calculate Your Earning Potential
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            See how much you could earn with Rushr's emergency job platform
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-blue-200">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Calculator */}
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">
                  Annual Revenue Calculator
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Target Annual Revenue: ${revenueValue.toLocaleString()}
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="30000"
                        max="150000"
                        step="5000"
                        value={revenueValue}
                        onChange={(e) => setRevenueValue(parseInt(e.target.value))}
                        className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>$30k</span>
                        <span>$150k</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        ${monthlyRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">Monthly</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {weeklyJobs}
                      </div>
                      <div className="text-sm text-slate-600">Jobs/Week</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Bell className="w-5 h-5" />
                      <span className="font-medium">With Signals</span>
                    </div>
                    <div className="text-2xl font-bold">
                      +${signalsBoost.toLocaleString()}/year
                    </div>
                    <div className="text-sm opacity-90">
                      30% more revenue potential
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Revenue Drivers
                </h3>

                <div className="space-y-4">
                  <RevenueFeature
                    icon={Zap}
                    title="Emergency Response"
                    description="Higher rates for urgent work"
                    value="+25% rates"
                  />
                  <RevenueFeature
                    icon={Bell}
                    title="Signals Early Alerts"
                    description="First to bid on new opportunities"
                    value="+30% jobs"
                  />
                  <RevenueFeature
                    icon={Star}
                    title="Verified Credentials"
                    description="Trust badges increase win rate"
                    value="+40% wins"
                  />
                  <RevenueFeature
                    icon={Users}
                    title="1-Click Rehire"
                    description="Repeat customers = steady income"
                    value="+50% recurring"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => go('/jobs')}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  Start Earning Now
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Revenue Feature Component
function RevenueFeature({
  icon: Icon,
  title,
  description,
  value
}: {
  icon: any
  title: string
  description: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">{description}</div>
      </div>
      <div className="font-bold text-blue-600">{value}</div>
    </div>
  )
}

// Profile Builder Section
function ProfileBuilderSection() {
  const profileElements = [
    { icon: "🧾", title: "Licensing & Insurance", description: "Upload docs for trust badges" },
    { icon: "🛠️", title: "Specialties & Services", description: "List your expertise areas" },
    { icon: "📍", title: "Service Area", description: "Set ZIP codes or radius" },
    { icon: "💬", title: "Professional Bio", description: "Tell your story briefly" },
    { icon: "📸", title: "Portfolio Photos", description: "Show your best work" },
    { icon: "⭐", title: "Reviews & Ratings", description: "Build social proof" }
  ]

  return (
    <section className="py-20">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Build a Winning Profile
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Homeowners hire faster when your profile answers their questions at a glance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profileElements.map((element, index) => (
            <ProfileElementCard key={element.title} element={element} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Profile Element Card
function ProfileElementCard({ element, index }: { element: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
          {element.icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-2">{element.title}</h3>
          <p className="text-sm text-slate-600">{element.description}</p>
        </div>
      </div>
    </motion.div>
  )
}

// Signals Section
function SignalsSection({ go }: { go: (href: string) => void }) {
  return (
    <section className="py-12 bg-white">
      <div className="container-max">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-4xl mb-4"
              >
                ⚡
              </motion.div>

              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Get Ahead with Signals
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                Be the first to know about new opportunities before homeowners even post jobs
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <SignalsFeature
                icon="🔍"
                title="Real-time Monitoring"
                description="Watch for failed inspections and violations automatically"
              />
              <SignalsFeature
                icon="⚡"
                title="Instant Alerts"
                description="Get notified the moment opportunities match your criteria"
              />
              <SignalsFeature
                icon="🎯"
                title="Custom Rules"
                description="Set filters for location, category, and keywords"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go('/signals')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Learn How Signals Works
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go('/signals/dashboard')}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <Target className="w-5 h-5" />
                Open Signals Dashboard
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Signals Feature Component
function SignalsFeature({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  )
}

// Why Contractors Section
function WhyContractorsSection() {
  const features = [
    {
      icon: Zap,
      title: "Emergency Priority",
      description: "Higher rates for urgent work with immediate availability requirements.",
      stats: "+25% rates"
    },
    {
      icon: Shield,
      title: "Verified Platform",
      description: "Build trust with licensing badges and verified credentials.",
      stats: "100% verified"
    },
    {
      icon: Target,
      title: "Smart Matching",
      description: "Get matched to jobs that fit your skills and service area perfectly.",
      stats: "3x better fit"
    },
    {
      icon: TrendingUp,
      title: "Growth Tools",
      description: "Templates, analytics, and tools to grow your contracting business.",
      stats: "40% more wins"
    }
  ]

  return (
    <section className="py-20">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Why Contractors Choose Rushr
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Built specifically for emergency service professionals who want to grow their business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <ContractorFeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Contractor Feature Card
function ContractorFeatureCard({ feature, index }: { feature: any, index: number }) {
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="text-center group"
    >
      <div className="bg-blue-50 rounded-3xl p-8 hover:bg-blue-100 transition-all duration-300">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-3">
          {feature.title}
        </h3>

        <p className="text-slate-600 mb-4 leading-relaxed">
          {feature.description}
        </p>

        <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          {feature.stats}
        </div>
      </div>
    </motion.div>
  )
}

// Success Stories Section
function SuccessStoriesSection() {
  const stories = [
    {
      name: "Mike Rodriguez",
      trade: "Emergency Plumber",
      revenue: "$95k/year",
      testimonial: "Signals alerts helped me find 3x more emergency jobs. I'm booked solid now.",
      avatar: "🔧"
    },
    {
      name: "Sarah Chen",
      trade: "Electrical Contractor",
      revenue: "$120k/year",
      testimonial: "The platform's trust badges and quick response system tripled my win rate.",
      avatar: "⚡"
    },
    {
      name: "Tony Martinez",
      trade: "HVAC Specialist",
      revenue: "$85k/year",
      testimonial: "Emergency rates and repeat customers from 1-click rehire changed my business.",
      avatar: "❄️"
    }
  ]

  return (
    <section className="py-20 bg-blue-50">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Contractor Success Stories
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Real contractors sharing how Rushr transformed their business
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <SuccessStoryCard key={story.name} story={story} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}

// Success Story Card
function SuccessStoryCard({ story, index }: { story: any, index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-3xl p-8 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300"
    >
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">{story.avatar}</div>
        <h3 className="font-bold text-slate-900">{story.name}</h3>
        <p className="text-sm text-slate-600">{story.trade}</p>
        <div className="mt-2 inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
          <DollarSign className="w-4 h-4" />
          {story.revenue}
        </div>
      </div>

      <blockquote className="text-slate-600 italic text-center">
        "{story.testimonial}"
      </blockquote>

      <div className="flex justify-center mt-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
      </div>
    </motion.div>
  )
}

// Final CTA Section
function FinalCTASection({ go }: { go: (href: string) => void }) {
  return (
    <section className="py-12">
      <div className="container-max">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-center text-white"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-4xl mb-4"
            >
              💰
            </motion.div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to Start Earning More?
            </h2>

            <p className="text-lg mb-6 opacity-90">
              Join thousands of contractors already using Rushr to grow their business with quality emergency jobs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go('/jobs')}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                Browse Available Jobs
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/signals"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  Explore Signals
                </Link>
              </motion.div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>$75k+ revenue</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>2-5 min response</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>3x more jobs</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Stat Card Component
function StatCard({ icon: Icon, value, label }: { icon: any, value: string, label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white/90 rounded-xl p-4 border border-blue-200 shadow-lg text-center"
    >
      <Icon className="w-6 h-6 text-blue-600 mx-auto mb-2" />
      <div className="text-xl font-bold text-blue-600 mb-1">{value}</div>
      <div className="text-xs text-slate-600 font-medium">{label}</div>
    </motion.div>
  )
}

// CSS for animations and slider
const styles = `
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  background: #2563EB;
  border-radius: 50%;
  cursor: pointer;
}
.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  background: #2563EB;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
`

// Add styles to head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}