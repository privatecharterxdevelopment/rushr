'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
}

interface KYCModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userId: string
}

export default function KYCModal({ isOpen, onClose, onComplete, userId }: KYCModalProps) {
  const [step, setStep] = useState<'identity' | 'financial' | 'review'>('identity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    taxId: ''
  })

  if (!isOpen) return null

  const updateForm = (field: keyof KYCFormData, value: string) => {
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

  const handleNext = () => {
    setError(null)

    if (step === 'identity') {
      const errors = validateIdentity()
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }
      setStep('financial')
    } else if (step === 'financial') {
      const errors = validateFinancial()
      if (errors.length > 0) {
        setError(errors.join(', '))
        return
      }
      setStep('review')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Create KYC record in database
      const { error: kycError } = await supabase
        .from('contractor_kyc')
        .insert({
          contractor_id: userId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          ssn_last_4: formData.ssn.slice(-4),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          driver_license_number: formData.driverLicenseNumber,
          driver_license_state: formData.driverLicenseState,
          bank_account_last_4: formData.bankAccountNumber.slice(-4),
          bank_routing_number: formData.bankRoutingNumber,
          tax_id: formData.taxId,
          status: 'pending'
        })

      if (kycError) {
        setError(kycError.message)
        return
      }

      // Update contractor profile KYC status
      const { error: updateError } = await supabase
        .from('pro_contractors')
        .update({ kyc_status: 'in_progress' })
        .eq('id', userId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      onComplete()
    } catch (err: any) {
      setError(err.message || 'An error occurred during KYC submission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your KYC Verification</h2>
              <p className="text-gray-600 mt-1">Required to unlock all Pro features</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step {step === 'identity' ? '1' : step === 'financial' ? '2' : '3'} of 3</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {step === 'identity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateForm('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateForm('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateForm('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Security Number</label>
                <input
                  type="password"
                  placeholder="XXX-XX-XXXX"
                  value={formData.ssn}
                  onChange={(e) => updateForm('ssn', e.target.value.replace(/\D/g, ''))}
                  maxLength={9}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateForm('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateForm('state', e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateForm('zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'financial' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver License Number</label>
                  <input
                    type="text"
                    value={formData.driverLicenseNumber}
                    onChange={(e) => updateForm('driverLicenseNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Driver License State</label>
                  <input
                    type="text"
                    value={formData.driverLicenseState}
                    onChange={(e) => updateForm('driverLicenseState', e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Account Number</label>
                <input
                  type="password"
                  value={formData.bankAccountNumber}
                  onChange={(e) => updateForm('bankAccountNumber', e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Routing Number</label>
                <input
                  type="text"
                  value={formData.bankRoutingNumber}
                  onChange={(e) => updateForm('bankRoutingNumber', e.target.value.replace(/\D/g, ''))}
                  maxLength={9}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID (EIN or SSN)</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => updateForm('taxId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Your Information</h3>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                <div><strong>Date of Birth:</strong> {formData.dateOfBirth}</div>
                <div><strong>Address:</strong> {formData.address}, {formData.city}, {formData.state} {formData.zipCode}</div>
                <div><strong>Driver License:</strong> {formData.driverLicenseNumber} ({formData.driverLicenseState})</div>
                <div><strong>Bank Account:</strong> ***{formData.bankAccountNumber.slice(-4)}</div>
                <div><strong>Routing Number:</strong> {formData.bankRoutingNumber}</div>
                <div><strong>Tax ID:</strong> {formData.taxId}</div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  By submitting this form, you agree to allow Rushr to verify your identity and financial information.
                  Your information is encrypted and stored securely.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
          {step !== 'identity' && (
            <button
              onClick={() => setStep(step === 'financial' ? 'identity' : 'financial')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Back
            </button>
          )}

          <div className="ml-auto flex gap-3">
            {step !== 'review' ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit KYC'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}