'use client'

import React from 'react'
import { Settings as SettingsIcon, Bell, Shield, Database, Mail } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          Configure admin panel settings and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notification Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">New contractor applications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">New support tickets</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-slate-300">System alerts</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
            <p>Admin access is restricted to authorized users only.</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Current admin: admin@userushr.com
            </p>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Database</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
            <p>Real-time updates are enabled across all admin pages.</p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Using Supabase Realtime subscriptions
            </p>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-6 w-6 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
            <p>Email notifications are sent for critical events.</p>
            <button className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Configure Email Settings
            </button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 rounded-2xl border border-amber-200 dark:border-amber-900 p-6">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Additional settings can be configured in the Supabase dashboard.
        </p>
      </div>
    </div>
  )
}
