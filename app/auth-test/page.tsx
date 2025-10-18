'use client'

import { openAuth } from '../../components/AuthModal'

export default function AuthTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Test Authentication</h1>
        <div className="space-x-4">
          <button
            onClick={() => openAuth('signin')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Sign In
          </button>
          <button
            onClick={() => openAuth('signup')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Sign Up
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Click the buttons above to test the authentication modals
        </p>
      </div>
    </div>
  )
}