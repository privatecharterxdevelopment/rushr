import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export interface HomeownerStats {
  active_services: number
  completed_services: number
  unread_messages: number
  trusted_contractors: number
  total_spent: number
  first_job_completed: boolean
  member_since: string
}

export interface HomeownerJob {
  id: string
  job_number?: number
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'emergency'
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  contractor_id: string | null
  estimated_cost: number | null
  final_cost: number | null
  scheduled_date: string | null
  completed_date: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface HomeownerMessage {
  id: string
  message_text: string
  message_type: 'text' | 'image' | 'document' | 'system'
  sender_type: 'homeowner' | 'contractor' | 'system'
  is_read: boolean
  created_at: string
  job_id: string | null
  contractor_id: string | null
}

export function useHomeownerStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<HomeownerStats | null>(null)
  const [jobs, setJobs] = useState<HomeownerJob[]>([])
  const [messages, setMessages] = useState<HomeownerMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!user) return

    try {
      // Parallelize all three queries to reduce load time
      const [statsResult, jobsResult, messagesResult] = await Promise.all([
        supabase
          .from('homeowner_dashboard_stats')
          .select('*')
          .eq('homeowner_id', user.id)
          .single(),
        supabase
          .from('homeowner_jobs')
          .select('*')
          .eq('homeowner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('homeowner_messages')
          .select('*')
          .eq('homeowner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
      ])

      // Handle stats
      if (statsResult.error) {
        // If no stats exist yet, use defaults
        setStats({
          active_services: 0,
          completed_services: 0,
          unread_messages: 0,
          trusted_contractors: 0,
          total_spent: 0,
          first_job_completed: false,
          member_since: new Date().toISOString()
        })
      } else {
        setStats(statsResult.data)
      }

      // Handle jobs
      if (jobsResult.error) {
        console.error('Error fetching jobs:', jobsResult.error)
        setJobs([])
      } else {
        setJobs(jobsResult.data || [])
      }

      // Handle messages
      if (messagesResult.error) {
        console.error('Error fetching messages:', messagesResult.error)
        setMessages([])
      } else {
        setMessages(messagesResult.data || [])
      }

    } catch (err) {
      console.error('Error in fetchStats:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase.rpc('mark_message_read', {
        p_message_id: messageId
      })

      if (error) {
        console.error('Error marking message as read:', error)
      } else {
        // Update local state
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, is_read: true }
              : msg
          )
        )
        // Refresh stats to update unread count
        fetchStats()
      }
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  const updateJobStatus = async (jobId: string, newStatus: HomeownerJob['status']) => {
    try {
      const { error } = await supabase.rpc('update_job_status', {
        p_job_id: jobId,
        p_new_status: newStatus,
        p_completed_date: newStatus === 'completed' ? new Date().toISOString() : null
      })

      if (error) {
        console.error('Error updating job status:', error)
      } else {
        // Refresh data
        fetchStats()
      }
    } catch (err) {
      console.error('Error updating job status:', err)
    }
  }

  const addTrustedContractor = async (contractorId: string, trustLevel: 'trusted' | 'preferred' = 'trusted') => {
    if (!user) return

    try {
      const { error } = await supabase.rpc('add_trusted_contractor', {
        p_homeowner_id: user.id,
        p_contractor_id: contractorId,
        p_trust_level: trustLevel
      })

      if (error) {
        console.error('Error adding trusted contractor:', error)
      } else {
        // Refresh stats
        fetchStats()
      }
    } catch (err) {
      console.error('Error adding trusted contractor:', err)
    }
  }

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) {
      // Reset state when no user
      setStats(null)
      setJobs([])
      setMessages([])
      setLoading(false)
      return
    }

    // Initial fetch
    const loadInitialData = async () => {
      if (!user) return

      try {
        // Parallelize all three queries to reduce load time
        const [statsResult, jobsResult, messagesResult] = await Promise.all([
          supabase
            .from('homeowner_dashboard_stats')
            .select('*')
            .eq('homeowner_id', user.id)
            .single(),
          supabase
            .from('homeowner_jobs')
            .select('*')
            .eq('homeowner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('homeowner_messages')
            .select('*')
            .eq('homeowner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)
        ])

        // Handle stats
        if (statsResult.error) {
          setStats({
            active_services: 0,
            completed_services: 0,
            unread_messages: 0,
            trusted_contractors: 0,
            total_spent: 0,
            first_job_completed: false,
            member_since: new Date().toISOString()
          })
        } else {
          setStats(statsResult.data)
        }

        // Handle jobs
        if (jobsResult.error) {
          console.error('Error fetching jobs:', jobsResult.error)
          setJobs([])
        } else {
          setJobs(jobsResult.data || [])
        }

        // Handle messages
        if (messagesResult.error) {
          console.error('Error fetching messages:', messagesResult.error)
          setMessages([])
        } else {
          setMessages(messagesResult.data || [])
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    // Debounce timer for fetchStats to prevent excessive calls
    let debounceTimer: NodeJS.Timeout | null = null
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        loadInitialData()
      }, 500)
    }

    // Subscribe to job changes
    const jobsSubscription = supabase
      .channel('homeowner_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homeowner_jobs',
          filter: `homeowner_id=eq.${user.id}`
        },
        () => {
          debouncedRefresh()
        }
      )
      .subscribe()

    // Subscribe to message changes
    const messagesSubscription = supabase
      .channel('homeowner_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'homeowner_messages',
          filter: `homeowner_id=eq.${user.id}`
        },
        () => {
          debouncedRefresh()
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      jobsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
    }
  }, [user])

  return {
    stats,
    jobs,
    messages,
    loading,
    error,
    markMessageAsRead,
    updateJobStatus,
    addTrustedContractor,
    refreshStats: fetchStats
  }
}