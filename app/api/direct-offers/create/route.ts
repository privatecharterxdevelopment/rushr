// app/api/direct-offers/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '../../../../lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    const {
      contractor_id,
      title,
      description,
      category,
      priority = 'normal',
      offered_amount,
      estimated_duration_hours,
      preferred_start_date,
      address,
      city,
      state,
      zip,
      latitude,
      longitude,
      homeowner_notes,
    } = body

    // Validate required fields
    if (!contractor_id || !title || !description || !category || !offered_amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify contractor exists
    const { data: contractor, error: contractorError } = await supabase
      .from('pro_contractors')
      .select('id')
      .eq('id', contractor_id)
      .single()

    if (contractorError || !contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      )
    }

    // Create the direct offer using the function
    const { data: offerId, error: createError } = await supabase.rpc(
      'create_direct_offer',
      {
        p_contractor_id: contractor_id,
        p_title: title,
        p_description: description,
        p_category: category,
        p_offered_amount: parseFloat(offered_amount),
        p_priority: priority,
        p_address: address || null,
        p_city: city || null,
        p_state: state || null,
        p_zip: zip || null,
        p_latitude: latitude ? parseFloat(latitude) : null,
        p_longitude: longitude ? parseFloat(longitude) : null,
        p_estimated_duration_hours: estimated_duration_hours
          ? parseInt(estimated_duration_hours)
          : null,
        p_preferred_start_date: preferred_start_date || null,
        p_homeowner_notes: homeowner_notes || null,
      }
    )

    if (createError) {
      console.error('Error creating offer:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create offer' },
        { status: 500 }
      )
    }

    // Send notification to contractor (optional - can add when pro_contractors has user link)
    // For now, notifications will be created when contractor views their dashboard
    // TODO: Add notification system when pro_contractors table has auth.users reference

    return NextResponse.json(
      {
        success: true,
        offer_id: offerId,
        message: 'Offer created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in create direct offer:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
