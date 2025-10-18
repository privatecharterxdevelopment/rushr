'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import LoadingSpinner, { PageLoading } from '../../components/LoadingSpinner'
import {
  MapPin,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Navigation,
  Activity,
  Filter,
  Search,
  Settings,
  Bell,
  Zap,
  Truck,
  Wrench,
  Battery,
  Signal,
  Eye,
  Send,
  Timer,
  DollarSign,
  TrendingUp,
  Wifi,
  WifiOff,
  Radio,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  Target,
  Calendar,
  Star,
  ThermometerSun,
  Droplets,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Volume2,
  VolumeX,
} from 'lucide-react'

type ContractorStatus = 'available' | 'en-route' | 'on-job' | 'break' | 'offline'
type JobPriority = 'emergency' | 'urgent' | 'standard'
type JobStatus = 'pending' | 'assigned' | 'in-progress' | 'completed'

interface Contractor {
  id: string
  name: string
  status: ContractorStatus
  location: { lat: number; lng: number }
  specialty: string
  rating: number
  jobsCompleted: number
  responseTime: number
  currentJob?: string
  eta?: number
  lastUpdate: Date
  phone: string
  hourlyRate: number
  avatar: string
}

interface Job {
  id: string
  title: string
  priority: JobPriority
  status: JobStatus
  location: { lat: number; lng: number; address: string }
  customer: {
    name: string
    phone: string
    rating: number
  }
  description: string
  estimatedDuration: number
  hourlyRate: number
  assignedTo?: string
  createdAt: Date
  completedAt?: Date
  category: string
  emergencyLevel?: number
}

export default function TeamsPage() {
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [timeFilter, setTimeFilter] = useState('today')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  // Live signal data for major US cities
  const [liveSignals, setLiveSignals] = useState([
    { id: 'nyc', name: 'New York City', lat: 40.7128, lng: -74.0060, activeUsers: 0, lastUpdate: new Date() },
    { id: 'la', name: 'Los Angeles', lat: 34.0522, lng: -118.2437, activeUsers: 0, lastUpdate: new Date() },
    { id: 'chicago', name: 'Chicago', lat: 41.8781, lng: -87.6298, activeUsers: 0, lastUpdate: new Date() },
    { id: 'houston', name: 'Houston', lat: 29.7604, lng: -95.3698, activeUsers: 0, lastUpdate: new Date() },
    { id: 'phoenix', name: 'Phoenix', lat: 33.4484, lng: -112.0740, activeUsers: 0, lastUpdate: new Date() },
    { id: 'philly', name: 'Philadelphia', lat: 39.9526, lng: -75.1652, activeUsers: 0, lastUpdate: new Date() },
    { id: 'san-antonio', name: 'San Antonio', lat: 29.4241, lng: -98.4936, activeUsers: 0, lastUpdate: new Date() },
    { id: 'san-diego', name: 'San Diego', lat: 32.7157, lng: -117.1611, activeUsers: 0, lastUpdate: new Date() },
    { id: 'dallas', name: 'Dallas', lat: 32.7767, lng: -96.7970, activeUsers: 0, lastUpdate: new Date() },
    { id: 'san-jose', name: 'San Jose', lat: 37.3382, lng: -121.8863, activeUsers: 0, lastUpdate: new Date() },
    { id: 'austin', name: 'Austin', lat: 30.2672, lng: -97.7431, activeUsers: 0, lastUpdate: new Date() },
    { id: 'jacksonville', name: 'Jacksonville', lat: 30.3322, lng: -81.6557, activeUsers: 0, lastUpdate: new Date() },
    { id: 'fort-worth', name: 'Fort Worth', lat: 32.7555, lng: -97.3308, activeUsers: 0, lastUpdate: new Date() },
    { id: 'columbus', name: 'Columbus', lat: 39.9612, lng: -82.9988, activeUsers: 0, lastUpdate: new Date() },
    { id: 'charlotte', name: 'Charlotte', lat: 35.2271, lng: -80.8431, activeUsers: 0, lastUpdate: new Date() },
    { id: 'seattle', name: 'Seattle', lat: 47.6062, lng: -122.3321, activeUsers: 0, lastUpdate: new Date() },
    { id: 'denver', name: 'Denver', lat: 39.7392, lng: -104.9903, activeUsers: 0, lastUpdate: new Date() },
    { id: 'washington', name: 'Washington DC', lat: 38.9072, lng: -77.0369, activeUsers: 0, lastUpdate: new Date() },
    { id: 'boston', name: 'Boston', lat: 42.3601, lng: -71.0589, activeUsers: 0, lastUpdate: new Date() },
    { id: 'el-paso', name: 'El Paso', lat: 31.7619, lng: -106.4850, activeUsers: 0, lastUpdate: new Date() },
    { id: 'detroit', name: 'Detroit', lat: 42.3314, lng: -83.0458, activeUsers: 0, lastUpdate: new Date() },
    { id: 'nashville', name: 'Nashville', lat: 36.1627, lng: -86.7816, activeUsers: 0, lastUpdate: new Date() },
    { id: 'memphis', name: 'Memphis', lat: 35.1495, lng: -90.0490, activeUsers: 0, lastUpdate: new Date() },
    { id: 'portland', name: 'Portland', lat: 45.5152, lng: -122.6784, activeUsers: 0, lastUpdate: new Date() },
    { id: 'oklahoma-city', name: 'Oklahoma City', lat: 35.4676, lng: -97.5164, activeUsers: 0, lastUpdate: new Date() },
    { id: 'las-vegas', name: 'Las Vegas', lat: 36.1699, lng: -115.1398, activeUsers: 0, lastUpdate: new Date() },
    { id: 'louisville', name: 'Louisville', lat: 38.2527, lng: -85.7585, activeUsers: 0, lastUpdate: new Date() },
    { id: 'baltimore', name: 'Baltimore', lat: 39.2904, lng: -76.6122, activeUsers: 0, lastUpdate: new Date() },
    { id: 'milwaukee', name: 'Milwaukee', lat: 43.0389, lng: -87.9065, activeUsers: 0, lastUpdate: new Date() },
    { id: 'albuquerque', name: 'Albuquerque', lat: 35.0844, lng: -106.6504, activeUsers: 0, lastUpdate: new Date() }
  ])

  // Real contractor data - loaded from API in production
  const [contractors, setContractors] = useState<Contractor[]>([])

  // Real job data - loaded from API in production
  const [jobs, setJobs] = useState<Job[]>([])

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // Show loading for 1.5 seconds

    return () => clearTimeout(timer)
  }, [])

  // Real-time signal simulation
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate live activity on signals
      setLiveSignals(prev => prev.map(signal => ({
        ...signal,
        activeUsers: Math.floor(Math.random() * 50) + Math.floor(Math.random() * 20), // Random activity between 0-69
        lastUpdate: new Date()
      })))
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Calculate metrics from live signals
  const metrics = {
    activeSignals: liveSignals.filter(s => s.activeUsers > 0).length,
    totalUsers: liveSignals.reduce((sum, s) => sum + s.activeUsers, 0),
    liveCities: liveSignals.length,
    peakActivity: Math.max(...liveSignals.map(s => s.activeUsers))
  }

  const getStatusColor = (status: ContractorStatus) => {
    switch (status) {
      case 'available': return 'bg-emerald-500'
      case 'en-route': return 'bg-blue-500'
      case 'on-job': return 'bg-amber-500'
      case 'break': return 'bg-gray-400'
      case 'offline': return 'bg-red-500'
    }
  }

  const getPriorityColor = (priority: JobPriority) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500'
      case 'urgent': return 'bg-amber-500'
      case 'standard': return 'bg-blue-500'
    }
  }

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m ago`
    return `${minutes}m ago`
  }

  return (
    <PageLoading isLoading={isLoading} loadingText="Loading live signals...">
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${isFullscreen ? 'fixed inset-0 z-50' : ''} -mx-3 sm:-mx-4 lg:-mx-6`}>
      {/* Simplified Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              Rushr Teams
            </h1>
            <p className="text-slate-600 mt-1">Dispatch Operations</p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full ${autoRefresh ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Live Signal Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Signal className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Live Signals</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.activeSignals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Cities</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.liveCities}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Peak Activity</p>
                <p className="text-2xl font-bold text-slate-900">{metrics.peakActivity}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pb-20">
          {/* Live Signal Map */}
          <div>
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    Live Signal Map - United States
                  </CardTitle>
                  <div className="flex gap-2">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                      {liveSignals.filter(s => s.activeUsers > 0).length} Active
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="relative h-[500px] bg-gradient-to-br from-blue-50 to-slate-100 rounded-lg overflow-hidden border">
                  {/* US Map Background */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `
                      linear-gradient(rgba(59,130,246,0.2) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '30px 30px',
                  }} />

                  {/* Live Signal Markers */}
                  <div className="absolute inset-4">
                    {liveSignals.map((signal, index) => {
                      // Convert lat/lng to approximate positions on our map
                      const x = ((signal.lng + 125) / 60) * 100; // Rough conversion for US longitude
                      const y = ((50 - signal.lat) / 20) * 100; // Rough conversion for US latitude

                      return (
                        <div
                          key={signal.id}
                          className="absolute cursor-pointer group"
                          style={{
                            left: `${Math.max(5, Math.min(95, x))}%`,
                            top: `${Math.max(5, Math.min(95, y))}%`
                          }}
                        >
                          {signal.activeUsers > 0 ? (
                            <>
                              {/* Pulsing Ring for Active Signals */}
                              <div className="absolute inset-0 w-6 h-6 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                              <div className="relative w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>

                              {/* Tooltip */}
                              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                {signal.name}: {signal.activeUsers} users
                              </div>
                            </>
                          ) : (
                            <div className="w-3 h-3 bg-slate-300 rounded-full border border-white shadow-sm"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Data Legend */}
                  <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-sm font-medium mb-2">Live Activity</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span>Active Signals ({liveSignals.filter(s => s.activeUsers > 0).length})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                        <span>Inactive ({liveSignals.filter(s => s.activeUsers === 0).length})</span>
                      </div>
                      <div className="pt-1 text-xs text-slate-500">
                        Total: {liveSignals.reduce((sum, s) => sum + s.activeUsers, 0)} users online
                      </div>
                    </div>
                  </div>

                  {/* Live Update Indicator */}
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Summary */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Top Active Cities
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {liveSignals
                  .filter(signal => signal.activeUsers > 0)
                  .sort((a, b) => b.activeUsers - a.activeUsers)
                  .slice(0, 10)
                  .map((signal, index) => (
                    <div key={signal.id} className="flex items-center justify-between p-2 rounded border bg-gradient-to-r from-emerald-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-900">{signal.name}</div>
                          <div className="text-xs text-slate-500">Updated {formatTime(signal.lastUpdate)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">{signal.activeUsers}</div>
                        <div className="text-xs text-slate-400">users</div>
                      </div>
                    </div>
                  ))}

                {liveSignals.filter(signal => signal.activeUsers > 0).length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <Signal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">No active signals</div>
                    <div className="text-xs">Waiting for user activity...</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                  <div className="bg-red-500 text-white p-2 rounded mr-3">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Emergency Broadcast</div>
                    <div className="text-xs text-slate-500">Alert all available team</div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                  <div className="bg-blue-500 text-white p-2 rounded mr-3">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Team Check-in</div>
                    <div className="text-xs text-slate-500">Status update request</div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                  <div className="bg-amber-500 text-white p-2 rounded mr-3">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Route Optimization</div>
                    <div className="text-xs text-slate-500">Optimize all routes</div>
                  </div>
                </Button>

                <Button variant="outline" className="w-full justify-start h-auto p-3" size="sm">
                  <div className="bg-purple-500 text-white p-2 rounded mr-3">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Generate Report</div>
                    <div className="text-xs text-slate-500">Performance analytics</div>
                  </div>
                </Button>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      </div>
    </PageLoading>
  )
}