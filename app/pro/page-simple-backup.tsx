"use client"

import React from "react"

export default function ProHomeSimple() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Rushr Pro</h1>
        <p className="text-gray-600 mb-8">Welcome to the contractor side of Rushr</p>
        <div className="space-x-4">
          <a href="/pro/sign-in" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Sign In
          </a>
          <a href="/pro/contractor-signup" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Sign Up
          </a>
        </div>
      </div>
    </div>
  )
}