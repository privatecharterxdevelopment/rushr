'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import {
  Camera,
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Trash2
} from 'lucide-react'

export default function AvatarUploadPage() {
  const { user: homeownerUser, userProfile: homeownerProfile, refreshProfile: refreshHomeownerProfile, loading: homeownerLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Show loading spinner while auth is loading
  if (homeownerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <img
            src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
            alt="Loading..."
            className="h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4 object-contain"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Only homeowners can access this page - check if logged in
  if (!homeownerUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to upload avatar</h2>
          <Link href="/?auth=signin" className="btn-primary">Sign In</Link>
        </div>
      </div>
    )
  }

  // Allow access even if userProfile is missing - we can still upload avatar

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadAvatar = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError(null)

    try {
      // Convert image to base64 (eliminates need for storage buckets)
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          resolve(result)
        }
        reader.onerror = reject
        reader.readAsDataURL(selectedFile)
      })

      const base64Data = await base64Promise

      // Ensure we have an email for NOT NULL constraint
      if (!homeownerUser.email) {
        throw new Error('User email is missing. Please sign out and sign back in.')
      }

      // Update homeowner profile - use UPDATE instead of UPSERT
      const result = await supabase
        .from('user_profiles')
        .update({
          avatar_url: base64Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', homeownerUser.id)
        .select()

      let updateError = result.error
      let updateData = result.data

      // If update failed because profile doesn't exist, create it
      if (updateError?.code === 'PGRST116' || (updateData && updateData.length === 0)) {
        const insertResult = await supabase
          .from('user_profiles')
          .insert({
            id: homeownerUser.id,
            email: homeownerUser.email,
            avatar_url: base64Data,
            role: 'homeowner',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()

        updateError = insertResult.error
        updateData = insertResult.data
      }

      if (updateError) {
        console.error('Upload error details:', updateError)
        if (updateError.message.includes('row-level security')) {
          throw new Error('Permission denied - RLS policy blocking. Check console for details.')
        } else if (updateError.message.includes('column') && updateError.message.includes('avatar_url')) {
          throw new Error('Database schema issue - avatar_url column may not exist')
        } else {
          throw new Error(`Upload failed: ${updateError.message}. Check console for details.`)
        }
      }

      console.log('Upload successful! Data:', updateData)

      // Refresh profile context
      await refreshHomeownerProfile()

      setSuccess('✅ Avatar uploaded successfully!')

      // Clear form
      setSelectedFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard/homeowner')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }

  const removeAvatar = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return

    setLoading(true)
    setError(null)

    try {
      // Remove from homeowner profile
      const result = await supabase
        .from('user_profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', homeownerUser.id)

      if (result.error) {
        throw new Error(`Failed to remove avatar: ${result.error.message}`)
      }

      await refreshHomeownerProfile()
      setSuccess('✅ Avatar removed successfully!')

    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar')
    } finally {
      setLoading(false)
    }
  }

  const currentAvatarUrl = homeownerProfile?.avatar_url


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/homeowner"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900">
              <Camera className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Profile Image
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Upload a photo to personalize your profile
              </p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-300">{success}</span>
          </div>
        )}

        {/* Current Avatar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Current Image
          </h2>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Current avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {currentAvatarUrl ? 'Your current profile image' : 'No profile image uploaded'}
              </p>

              {currentAvatarUrl && (
                <button
                  onClick={removeAvatar}
                  disabled={loading}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload New Avatar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Upload New Image</h2>

          {/* File Input */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="avatar-upload"
            />

            <label
              htmlFor="avatar-upload"
              className="block border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
            >
              <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                PNG, JPG or JPEG (max 2MB)
              </p>
            </label>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Preview</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img
                    src={preview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedFile?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && (
            <div className="flex gap-3">
              <button
                onClick={uploadAvatar}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <img
                    src="https://jtrxdcccswdwlritgstp.supabase.co/storage/v1/object/public/contractor-logos/RushrLogoAnimation.gif"
                    alt="Loading..."
                    className="w-4 h-4 object-contain"
                  />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={loading}
                className="px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Image Guidelines</h3>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>• Use a clear, high-quality image</p>
            <p>• Face should be clearly visible and well-lit</p>
            <p>• Avoid group photos or images with multiple people</p>
            <p>• Keep it professional - this helps build trust</p>
          </div>
        </div>
      </div>
    </div>
  )
}