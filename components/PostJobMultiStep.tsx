'use client'

import { useState } from 'react'
import { MapPin, User, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PostJobMultiStepProps {
  // Form state
  address: string
  setAddress: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  category: string
  setCategory: (val: string) => void
  emergencyType: string
  setEmergencyType: (val: string) => void
  details: string
  setDetails: (val: string) => void
  sendAll: boolean
  setSendAll: (val: boolean) => void
  picked: string | null
  setPicked: (val: string | null) => void

  // Validation
  errors: Record<string, string>
  touched: Record<string, boolean>
  validateField: (field: string, value: string) => boolean
  handleFieldBlur: (field: string, value: string) => void

  // Data
  emergencyCategories: Array<{ key: string; label: string }>
  emergencyTypesMap: Record<string, Array<{ key: string; label: string; icon: string }>>
  nearbyContractors: any[]
  selectedContractor: any

  // Actions
  getCurrentLocation: () => void
  onSubmit: () => void

  // Photos
  photos: File[]
  setPhotos: (files: File[] | ((prev: File[]) => File[])) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadError: string

  // Auth
  userId: string | null

  // Initial step (optional - defaults to 1)
  initialStep?: number
}

export default function PostJobMultiStep(props: PostJobMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(props.initialStep || 1)
  const totalSteps = 4

  const steps = [
    { number: 1, title: 'Emergency', icon: '🚨' },
    { number: 2, title: 'Details', icon: '📝' },
    { number: 3, title: 'Choose Pro', icon: '👷' },
    { number: 4, title: 'Review', icon: '✓' },
  ]

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return props.validateField('category', props.category) && props.validateField('emergencyType', props.emergencyType)
      case 2:
        // Validate address and phone in step 2
        return props.validateField('address', props.address) && props.validateField('phone', props.phone)
      case 3:
        return true
      case 4:
        return true // Login check happens in parent
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      } else {
        // Final step - submit
        props.onSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Step Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep === step.number
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                      : currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-1 hidden sm:block font-satoshi ${currentStep === step.number ? 'font-bold text-emerald-600' : 'text-slate-500'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content - Fixed Height */}
      <div className="card" style={{ minHeight: '500px', maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Emergency Type */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn font-satoshi">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">🚨 Type of Emergency</h2>
                <p className="text-slate-600 text-sm">What kind of emergency are you experiencing?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Category <span className="text-emerald-600">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {props.emergencyCategories.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        props.setCategory(key)
                        if (key && props.emergencyTypesMap[key]?.length > 0) {
                          props.setEmergencyType(props.emergencyTypesMap[key][0].key)
                        }
                      }}
                      className={`px-4 py-2 rounded-full border-2 font-medium text-sm transition-all ${
                        props.category === key
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {props.category && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Specific Issue <span className="text-emerald-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {props.emergencyTypesMap[props.category]?.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => props.setEmergencyType(key)}
                        className={`relative p-4 rounded-lg border-2 transition-all text-center ${
                          props.emergencyType === key
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{icon}</div>
                        <div className="text-sm font-medium text-slate-900">{label}</div>
                        {props.emergencyType === key && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn font-satoshi">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">📝 Contact & Details</h2>
                <p className="text-slate-600 text-sm">Provide your contact information so pros can reach you</p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Emergency Location <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={props.address}
                    onChange={(e) => {
                      props.setAddress(e.target.value)
                      props.handleFieldBlur('address', e.target.value)
                    }}
                    onBlur={(e) => props.handleFieldBlur('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                      props.errors.address && props.touched.address ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={props.getCurrentLocation}
                    className="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 whitespace-nowrap flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Use Current
                  </button>
                </div>
                {props.errors.address && props.touched.address && (
                  <p className="text-sm text-red-500 mt-1">{props.errors.address}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={props.phone}
                  onChange={(e) => {
                    props.setPhone(e.target.value)
                    props.handleFieldBlur('phone', e.target.value)
                  }}
                  onBlur={(e) => props.handleFieldBlur('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    props.errors.phone && props.touched.phone ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                {props.errors.phone && props.touched.phone && (
                  <p className="text-sm text-red-500 mt-1">{props.errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
                <textarea
                  value={props.details}
                  onChange={(e) => props.setDetails(e.target.value)}
                  placeholder="Any additional details that might help..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Photos or Videos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={props.onUpload}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg"
                />
                {props.uploadError && <p className="text-sm text-emerald-600 mt-1">{props.uploadError}</p>}
                {props.photos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {props.photos.map((f, i) => (
                      <div key={i} className="relative">
                        <div className="h-24 w-full rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-500">{f.name.slice(0, 10)}...</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => props.setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Choose Pro */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn font-satoshi">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">👷 Choose Response Mode</h2>
                <p className="text-slate-600 text-sm">How would you like to find help?</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    props.setSendAll(true)
                    props.setPicked(null)
                  }}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    props.sendAll
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-3">🚨</div>
                  <div className="font-bold text-lg mb-1">Alert All Nearby</div>
                  <div className="text-sm text-slate-600">Fastest response - notify all available pros in your area</div>
                </button>

                <button
                  type="button"
                  onClick={() => props.setSendAll(false)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    !props.sendAll
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-3xl mb-3">👤</div>
                  <div className="font-bold text-lg mb-1">Select Specific Pro</div>
                  <div className="text-sm text-slate-600">Choose a contractor from the map</div>
                </button>
              </div>

              {!props.sendAll && props.selectedContractor && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="font-medium text-emerald-900">Selected: {props.selectedContractor.name}</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn font-satoshi">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">✓ Review Your Request</h2>
                <p className="text-slate-600 text-sm">Please confirm your emergency details</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium text-slate-500 mb-1">Emergency Location</div>
                  <div className="font-medium">{props.address || <span className="text-red-500">⚠️ Not set</span>}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium text-slate-500 mb-1">Contact Phone</div>
                  <div className="font-medium">{props.phone || <span className="text-red-500">⚠️ Not set</span>}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium text-slate-500 mb-1">Emergency Type</div>
                  <div className="font-medium">
                    {props.emergencyTypesMap[props.category]?.find(t => t.key === props.emergencyType)?.label || 'Emergency'}
                  </div>
                </div>

                {props.details && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm font-medium text-slate-500 mb-1">Details</div>
                    <div className="text-sm">{props.details}</div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium text-slate-500 mb-1">Response Mode</div>
                  <div className="font-medium">
                    {props.sendAll ? '🚨 Alert All Nearby Pros' : `👤 ${props.selectedContractor?.name || 'Select Pro'}`}
                  </div>
                </div>
              </div>

              {!props.userId && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-yellow-900 mb-1">⚠️ Login Required</div>
                  <div className="text-sm text-yellow-700">You need to be logged in to submit this request</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="border-t p-4 flex items-center justify-between gap-4 bg-slate-50 font-satoshi">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-white border border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-sm text-slate-500">
            Step {currentStep} of {totalSteps}
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2"
          >
            {currentStep === totalSteps ? (
              <>
                🚨 Submit Request
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
