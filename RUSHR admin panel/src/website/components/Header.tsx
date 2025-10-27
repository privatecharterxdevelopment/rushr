import React from 'react';
import LogoWordmark from './LogoWordmark';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <LogoWordmark />
        </div>

        {/* Navigation */}
        <nav className="ml-6 hidden md:flex items-center gap-6">
          <a href="/post-job" className="text-slate-700 hover:text-gray-900 font-medium">
            Find a Pro
          </a>
          <a href="/jobs" className="text-slate-700 hover:text-gray-900 font-medium">
            For Pros
          </a>
          <a href="/teams" className="text-slate-700 hover:text-gray-900 font-medium">
            Rushr Teams
          </a>
          <a href="/about" className="text-slate-700 hover:text-gray-900 font-medium">
            More
          </a>
          <a href="/dashboard" className="text-slate-700 hover:text-gray-900 font-medium">
            Dashboard
          </a>
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          <button className="inline-flex items-center px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 transition">
            Sign in / Sign up
          </button>
          
          <a href="#" className="hidden sm:inline font-semibold text-gray-900 hover:underline underline-offset-4 decoration-2">
            Join as a Pro
          </a>

          {/* Mobile menu button */}
          <button className="md:hidden ml-1 inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}