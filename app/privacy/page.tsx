'use client'
import React from 'react'
import Link from 'next/link'

export default function Privacy(){
  return (
    <div className="container-max section">
      <div className="max-w-3xl mx-auto card p-8">
        <h1 className="text-2xl font-semibold text-ink">Privacy Policy</h1>
        <p className="text-sm text-slate-600 mt-1">Last updated: {new Date().toLocaleDateString()}</p>

        <h2 className="mt-6 font-semibold text-ink">Overview</h2>
        <p className="mt-2 text-sm">This policy explains what we collect, how we use it, and your choices.</p>

        <h2 className="mt-4 font-semibold text-ink">Information We Collect</h2>
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          <li>Account data (name, email, role, ZIP).</li>
          <li>Content you submit (job details, messages, photos).</li>
          <li>Usage data (pages viewed, actions) and device data (cookies, IP).</li>
        </ul>

        <h2 className="mt-4 font-semibold text-ink">How We Use Information</h2>
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          <li>Provide and improve the Service, including Signals alerts.</li>
          <li>Communicate with you (support, notifications, marketing where permitted).</li>
          <li>Security, fraud prevention, and legal compliance.</li>
        </ul>

        <h2 className="mt-4 font-semibold text-ink">Sharing</h2>
        <p className="mt-2 text-sm">We share information with service providers, at your direction (e.g., messages to contractors), or as required by law.</p>

        <h2 className="mt-4 font-semibold text-ink">Your Choices</h2>
        <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
          <li>Access/update profile in <Link className="underline" href="/profile/settings">Settings</Link>.</li>
          <li>Opt out of marketing emails via unsubscribe links.</li>
          <li>Control cookies via your browser.</li>
        </ul>

        <h2 className="mt-4 font-semibold text-ink">Data Retention</h2>
        <p className="mt-2 text-sm">We retain data as long as needed to provide the Service and as required by law.</p>

        <h2 className="mt-4 font-semibold text-ink">Children</h2>
        <p className="mt-2 text-sm">The Service is not intended for children under 13.</p>

        <h2 className="mt-4 font-semibold text-ink">Contact</h2>
        <p className="mt-2 text-sm">Questions? Email <a className="underline" href="mailto:hello@userushr.com">hello@userushr.com</a>.</p>
      </div>
    </div>
  )
}