import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyKYCRefused } from '../../../../lib/emailService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/kyc/update-status
 * Updates KYC status and sends email if rejected
 * This should be called from the admin panel
 */
export async function POST(request: NextRequest) {
  try {
    const {
      contractorId,
      status,
      rejectionReason,
      rejectionDetails,
      requestedDocuments
    } = await request.json()

    if (!contractorId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: contractorId, status' },
        { status: 400 }
      )
    }

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified, rejected, or pending' },
        { status: 400 }
      )
    }

    // Update contractor KYC status
    const { error: updateError } = await supabase
      .from('pro_contractors')
      .update({
        kyc_verified: status === 'verified',
        kyc_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractorId)

    if (updateError) {
      console.error('Error updating KYC status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update KYC status', details: updateError.message },
        { status: 500 }
      )
    }

    // Send email if rejected
    if (status === 'rejected') {
      try {
        const { data: contractorAuth } = await supabase.auth.admin.getUserById(contractorId)
        const { data: contractor } = await supabase
          .from('pro_contractors')
          .select('name, business_name')
          .eq('id', contractorId)
          .single()

        if (contractorAuth?.user?.email && contractor) {
          const caseId = `KYC-${Date.now()}`
          const decisionDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          await notifyKYCRefused({
            contractorEmail: contractorAuth.user.email,
            contractorName: contractor.business_name || contractor.name || 'Professional',
            caseId: caseId,
            decisionDate: decisionDate,
            reasonPrimary: rejectionReason || 'Document Verification Failed',
            reasonDetails: rejectionDetails || 'The provided documents could not be verified. Please review and resubmit.',
            requestedDocuments: requestedDocuments || 'Valid government-issued ID, Business license (if applicable), Proof of insurance'
          })
        }
      } catch (emailError) {
        console.error('Failed to send KYC refusal email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `KYC status updated to ${status}`,
      emailSent: status === 'rejected'
    })

  } catch (error: any) {
    console.error('Error in /api/kyc/update-status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
