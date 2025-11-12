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
}

export default function PostJobMultiStep(props: PostJobMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  const steps = [
    { number: 1, title: 'Location', icon: '📍' },
    { number: 2, title: 'Emergency', icon: '🚨' },
    { number: 3, title: 'Details', icon: '📝' },
    { number: 4, title: 'Choose Pro', icon: '👷' },
    { number: 5, title: 'Review', icon: '✓' },
  ]

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return props.validateField('address', props.address) && props.validateField('phone', props.phone)
      case 2:
        return props.validateField('category', props.category) && props.validateField('emergencyType', props.emergencyType)
      case 3:
      case 4:
        return true
      case 5:
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
                      ? 'bg-red-600 text-white ring-4 ring-red-100 scale-110'
                      : currentStep > step.number
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${currentStep === step.number ? 'font-bold text-red-600' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-1 sm:mx-2 rounded transition-all ${currentStep > step.number ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content - Fixed Height */}
      <div className="card" style={{ minHeight: '500px', maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Location & Contact */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">📍 Emergency Location</h2>
                <p className="text-gray-600 text-sm">Where do you need help?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={props.address}
                    onChange={(e) => props.setAddress(e.target.value)}
                    onBlur={(e) => props.handleFieldBlur('address', e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      props.touched.address && props.errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={props.getCurrentLocation}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Use current location"
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                </div>
                {props.touched.address && props.errors.address && (
                  <p className="text-sm text-red-600 mt-1">{props.errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={props.phone}
                    onChange={(e) => props.setPhone(e.target.value)}
                    onBlur={(e) => props.handleFieldBlur('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                      props.touched.phone && props.errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    title="Use profile number"
                  >
                    <User className="h-5 w-5" />
                  </button>
                </div>
                {props.touched.phone && props.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{props.errors.phone}</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Type */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🚨 Type of Emergency</h2>
                <p className="text-gray-600 text-sm">What kind of emergency are you experiencing?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={props.category}
                  onChange={(e) => {
                    const newCategory = e.target.value
                    props.setCategory(newCategory)
                    if (newCategory && props.emergencyTypesMap[newCategory]?.length > 0) {
                      props.setEmergencyType(props.emergencyTypesMap[newCategory][0].key)
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-lg"
                >
                  <option value="">Select Emergency Category</option>
                  {props.emergencyCategories.map(({ key, label }) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {props.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Specific Issue <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {props.emergencyTypesMap[props.category]?.map(({ key, label, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => props.setEmergencyType(key)}
                        className={`relative p-4 rounded-lg border-2 transition-all text-center ${
                          props.emergencyType === key
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-3xl mb-2">{icon}</div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        {props.emergencyType === key && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
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

          {/* STEP 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Additional Information</h2>
                <p className="text-gray-600 text-sm">Help professionals understand your situation better (optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={props.details}
                  onChange={(e) => props.setDetails(e.target.value)}
                  placeholder="Any additional details that might help..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos or Videos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={props.onUpload}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
                {props.uploadError && <p className="text-sm text-red-600 mt-1">{props.uploadError}</p>}
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
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
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

          {/* STEP 4: Choose Pro */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">👷 Choose Response Mode</h2>
                <p className="text-gray-600 text-sm">How would you like to find help?</p>
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
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-3">🚨</div>
                  <div className="font-bold text-lg mb-1">Alert All Nearby</div>
                  <div className="text-sm text-gray-600">Fastest response - notify all available pros in your area</div>
                </button>

                <button
                  type="button"
                  onClick={() => props.setSendAll(false)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    !props.sendAll
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-3">👤</div>
                  <div className="font-bold text-lg mb-1">Select Specific Pro</div>
                  <div className="text-sm text-gray-600">Choose a contractor from the map</div>
                </button>
              </div>

              {!props.sendAll && props.selectedContractor && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="font-medium text-emerald-900">Selected: {props.selectedContractor.name}</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">✓ Review Your Request</h2>
                <p className="text-gray-600 text-sm">Please confirm your emergency details</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                  <div className="font-medium">{props.address}</div>
                  <div className="text-sm text-gray-600 mt-1">{props.phone}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">Emergency Type</div>
                  <div className="font-medium">
                    {props.emergencyTypesMap[props.category]?.find(t => t.key === props.emergencyType)?.label || 'Emergency'}
                  </div>
                </div>

                {props.details && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Details</div>
                    <div className="text-sm">{props.details}</div>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-500 mb-1">Response Mode</div>
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
        <div className="border-t p-4 flex items-center justify-between gap-4 bg-gray-50">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </div>

          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2"
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
