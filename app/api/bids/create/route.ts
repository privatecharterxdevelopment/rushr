import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyBidReceived } from '../../../../lib/emailService'
import { sendBidReceivedSMS } from '../../../../lib/smsService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/bids/create
 * Creates a job request from homeowner to contractor
 * This creates both a homeowner_job record and sends notification to contractor
 */
export async function POST(request: NextRequest) {
  try {
    const {
      homeownerId,
      contractorId,
      title,
      description,
      priceOffer,
      urgency = 'standard',
      category = 'General'
    } = await request.json()

    if (!homeownerId || !contractorId || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: homeownerId, contractorId, title, description' },
        { status: 400 }
      )
    }

    // 1. Create homeowner_job record
    const { data: job, error: jobError } = await supabase
      .from('homeowner_jobs')
      .insert({
        homeowner_id: homeownerId,
        title,
        description,
        category,
        priority: urgency === 'emergency' ? 'emergency' : urgency === 'urgent' ? 'high' : 'normal',
        status: 'bidding', // Job is open for bidding
        estimated_cost: priceOffer || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create job request', details: jobError?.message },
        { status: 500 }
      )
    }

    // 2. Create initial bid from contractor (auto-bid to link them)
    // This notifies the contractor they have a job request
    const { data: bid, error: bidError } = await supabase
      .from('job_bids')
      .insert({
        job_id: job.id,
        contractor_id: contractorId,
        homeowner_id: homeownerId,
        bid_amount: priceOffer || 0,
        description: 'Homeowner sent you a job request',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bidError) {
      console.error('Error creating bid:', bidError)
      // Don't fail the whole request if bid creation fails
      // The job is still created
    }

    // 3. Create notification for contractor
    const { data: contractor } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('id', homeownerId)
      .single()

    await supabase
      .from('notifications')
      .insert({
        user_id: contractorId,
        type: 'job_request',
        title: 'New job request',
        message: `${contractor?.name || 'A homeowner'} sent you a job request: "${title}"`,
        metadata: {
          job_id: job.id,
          bid_id: bid?.id,
          homeowner_id: homeownerId,
          urgency
        },
        read: false,
        created_at: new Date().toISOString()
      })

    // 4. Send email & SMS notifications to homeowner (non-blocking)
    try {
      const { data: homeownerUser } = await supabase
        .from('user_profiles')
        .select('name, phone')
        .eq('id', homeownerId)
        .single()

      const { data: contractorProfile } = await supabase
        .from('pro_contractors')
        .select('name, business_name')
        .eq('id', contractorId)
        .single()

      const { data: authUser } = await supabase.auth.admin.getUserById(homeownerId)

      const contractorName = contractorProfile?.business_name || contractorProfile?.name || 'Contractor'

      // Send email notification
      if (authUser?.user?.email && homeownerUser) {
        await notifyBidReceived({
          homeownerEmail: authUser.user.email,
          homeownerName: homeownerUser.name,
          contractorName: contractorName,
          jobTitle: title,
          bidAmount: priceOffer || 0,
          estimatedArrival: urgency === 'emergency' ? '15 minutes' : '30 minutes'
        })
      }

      // Send SMS notification
      if (homeownerUser?.phone) {
        await sendBidReceivedSMS({
          homeownerPhone: homeownerUser.phone,
          homeownerName: homeownerUser.name,
          contractorName: contractorName,
          jobTitle: title,
          bidAmount: priceOffer || 0
        })
      }
    } catch (error) {
      console.error('Failed to send bid notification:', error)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      bidId: bid?.id,
      status: 'pending',
      message: 'Job request sent successfully'
    })

  } catch (error: any) {
    console.error('Error in /api/bids/create:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    )
  }
}
