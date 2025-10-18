'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useProAuth } from '../../../contexts/ProAuthContext'
import { supabase } from '../../../lib/supabaseClient'

interface KYCFormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  ssn: string
  address: string
  city: string
  state: string
  zipCode: string
  driverLicenseNumber: string
  driverLicenseState: string
  bankAccountNumber: string
  bankRoutingNumber: string
  taxId: string
  identityDocument: File | null
  proofOfAddress: File | null
}

export default function KYCPage() {
  const { user, contractorProfile, loading: authLoading, updateKYCStatus } = useProAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'identity' | 'financial' | 'documents' | 'review'>('identity')

  const [formData, setFormData] = useState<KYCFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    driverLicenseNumber: '',
    driverLicenseState: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    taxId: '',
    identityDocument: null,
    proofOfAddress: null
  })

  // Redirect if not authenticated or doesn't need KYC
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/pro/sign-in')
      } else if (!contractorProfile) {
        router.push('/pro/contractor-signup')
      } else if (contractorProfile.kyc_status === 'completed') {
        router.push('/dashboard/contractor')
      } else if (contractorProfile.kyc_status === 'in_progress') {
        router.push('/pro/kyc/status')
      }
    }
  }, [user, contractorProfile, authLoading, router])

  const updateForm = (field: keyof KYCFormData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateIdentity = () => {
    const errors: string[] = []
    if (!formData.firstName.trim()) errors.push('First name is required')
    if (!formData.lastName.trim()) errors.push('Last name is required')
    if (!formData.dateOfBirth) errors.push('Date of birth is required')
    if (!formData.ssn || formData.ssn.length < 9) errors.push('Valid SSN is required')
    if (!formData.address.trim()) errors.push('Address is required')
    if (!formData.city.trim()) errors.push('City is required')
    if (!formData.state.trim()) errors.push('State is required')
    if (!formData.zipCode || !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) errors.push('Valid ZIP code is required')
    return errors
  }

  const validateFinancial = () => {
    const errors: string[] = []
    if (!formData.driverLicenseNumber.trim()) errors.push('Driver license number is required')
    if (!formData.driverLicenseState.trim()) errors.push('Driver license state is required')
    if (!formData.bankAccountNumber.trim()) errors.push('Bank account number is required')
    if (!formData.bankRoutingNumber || formData.bankRoutingNumber.length !== 9) errors.push('Valid routing number is required')
    if (!formData.taxId.trim()) errors.push('Tax ID (EIN or SSN) is required')
    return errors
  }

  const validateDocuments = () => {
    const errors: string[] = []
    if (!formData.identityDocument) errors.push('Identity document is required')
    if (!formData.proofOfAddress) errors.push('Proof of address is required')
    return errors
  }

  const handleNext = () => {
    setError(null)
    let errors: string[] = []

    switch (step) {
      case 'identity':
        errors = validateIdentity()
        if (errors.length === 0) setStep('financial')
        break
      case 'financial':
        errors = validateFinancial()
        if (errors.length === 0) setStep('documents')
        break
      case 'documents':
        errors = validateDocuments()
        if (errors.length === 0) setStep('review')
        break
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'financial':
        setStep('identity')
        break
      case 'documents':
        setStep('financial')
        break
      case 'review':
        setStep('documents')
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate all sections
      const identityErrors = validateIdentity()
      const financialErrors = validateFinancial()
      const documentErrors = validateDocuments()
      const allErrors = [...identityErrors, ...financialErrors, ...documentErrors]

      if (allErrors.length > 0) {
        setError(allErrors.join(', '))
        setLoading(false)
        return
      }

      // Create or update contractor profile with KYC data
      const { error: contractorError } = await supabase
        .from('pro_contractors')
        .upsert({
          id: user!.id,
          name: `${formData.firstName} ${formData.lastName}`,
          business_name: formData.businessName || `${formData.firstName} ${formData.lastName}`,
          email: user!.email,
          phone: formData.phone,
          license_number: formData.licenseNumber,
          license_state: formData.licenseState,
          insurance_carrier: formData.insuranceCarrier,
          base_zip: formData.businessAddress.split(',').pop()?.trim() || '',
          service_radius_miles: 25, // Default radius
          categories: formData.tradeCategories,
          status: 'pending',
          kyc_status: 'in_progress',
          kyc_data: formData, // Store the full KYC form data
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (contractorError) {
        console.error('Error creating contractor profile:', contractorError)
        setError('Failed to create contractor profile. Please try again.')
        setLoading(false)
        return
      }

      // Here you would normally submit to a KYC service like Plaid, Stripe, etc.
      // For now, we'll simulate the process and mark as completed after a delay
      setTimeout(async () => {
        await updateKYCStatus('completed')
        // Force refresh of contractor profile
        window.location.href = '/dashboard/contractor'
      }, 2000)

    } catch (err: any) {
      console.error('KYC submission error:', err)
      setError('Failed to submit KYC information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  }

  const stepTitles = {
    identity: 'Personal Identity',
    financial: 'Financial Information',
    documents: 'Document Verification',
    review: 'Review & Submit'
  }

  const currentStepIndex = ['identity', 'financial', 'documents', 'review'].indexOf(step)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">KYC Verification</h1>
            <p className="text-gray-600">Complete your identity verification to access Pro features</p>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>{stepTitles[step]}</span>
                <span>Step {currentStepIndex + 1} of 4</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentStepIndex + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Identity Step */}
            {step === 'identity' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.firstName}
                      onChange={(e) => updateForm('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.lastName}
                      onChange={(e) => updateForm('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.dateOfBirth}
                      onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Security Number *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.ssn}
                      onChange={(e) => updateForm('ssn', e.target.value.replace(/\D/g, ''))}
                      placeholder="000000000"
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.state}
                      onChange={(e) => updateForm('state', e.target.value)}
                      maxLength={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.zipCode}
                      onChange={(e) => updateForm('zipCode', e.target.value)}
                      placeholder="12345"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Financial Step */}
            {step === 'financial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver License Number *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.driverLicenseNumber}
                      onChange={(e) => updateForm('driverLicenseNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver License State *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.driverLicenseState}
                      onChange={(e) => updateForm('driverLicenseState', e.target.value)}
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.bankAccountNumber}
                      onChange={(e) => updateForm('bankAccountNumber', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Routing Number *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.bankRoutingNumber}
                      onChange={(e) => updateForm('bankRoutingNumber', e.target.value.replace(/\D/g, ''))}
                      maxLength={9}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (EIN or SSN) *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.taxId}
                    onChange={(e) => updateForm('taxId', e.target.value)}
                    placeholder="XX-XXXXXXX or XXX-XX-XXXX"
                    required
                  />
                </div>
              </div>
            )}

            {/* Documents Step */}
            {step === 'documents' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identity Document *</label>
                  <p className="text-xs text-gray-500 mb-2">Upload a clear photo of your driver's license, passport, or state ID</p>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    accept="image/*,.pdf"
                    onChange={(e) => updateForm('identityDocument', e.target.files?.[0] || null)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Address *</label>
                  <p className="text-xs text-gray-500 mb-2">Upload a recent utility bill, bank statement, or lease agreement</p>
                  <input
                    type="file"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    accept="image/*,.pdf"
                    onChange={(e) => updateForm('proofOfAddress', e.target.files?.[0] || null)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Information</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span>{formData.dateOfBirth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span>{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver License:</span>
                      <span>{formData.driverLicenseNumber} ({formData.driverLicenseState})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ID:</span>
                      <span>{formData.taxId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents:</span>
                      <span>
                        {formData.identityDocument?.name && formData.proofOfAddress?.name
                          ? `${formData.identityDocument.name}, ${formData.proofOfAddress.name}`
                          : 'Uploaded'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        Your information will be securely processed and verified. This typically takes 1-2 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handleBack}
                className={`px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 ${
                  step === 'identity' ? 'invisible' : ''
                }`}
                disabled={step === 'identity'}
              >
                Back
              </button>

              {step !== 'review' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit for Verification'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}