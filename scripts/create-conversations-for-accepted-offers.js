/**
 * Script to create conversations for accepted direct offers that don't have one yet
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createConversationsForAcceptedOffers() {
  console.log('🔍 Finding accepted direct offers without conversations...')

  // Get all accepted direct offers
  const { data: offers, error: offersError } = await supabase
    .from('direct_offers')
    .select('*')
    .in('contractor_response', ['accepted', 'agreement_reached'])

  if (offersError) {
    console.error('❌ Error fetching offers:', offersError)
    return
  }

  console.log(`📋 Found ${offers.length} accepted offers`)

  for (const offer of offers) {
    console.log(`\n📝 Processing offer ${offer.id}...`)

    // Check if conversation already exists
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('homeowner_id', offer.homeowner_id)
      .eq('pro_id', offer.contractor_id)
      .eq('job_id', offer.job_id)
      .single()

    if (existingConv) {
      console.log('  ✓ Conversation already exists')
      continue
    }

    // Get job title
    const { data: job } = await supabase
      .from('homeowner_jobs')
      .select('title')
      .eq('id', offer.job_id)
      .single()

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        homeowner_id: offer.homeowner_id,
        pro_id: offer.contractor_id,
        title: job?.title || 'Direct Offer Chat',
        job_id: offer.job_id,
        status: 'active'
      })
      .select()
      .single()

    if (convError) {
      console.error('  ❌ Error creating conversation:', convError)
      continue
    }

    console.log(`  ✅ Created conversation ${conversation.id}`)

    // Add initial system message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation.id,
        sender_id: offer.homeowner_id,
        message_type: 'system',
        content: `Direct offer accepted for: ${job?.title || 'this job'}`
      })

    if (msgError) {
      console.error('  ⚠️  Error creating system message:', msgError)
    } else {
      console.log('  ✅ Added system message')
    }
  }

  console.log('\n✨ Done!')
}

createConversationsForAcceptedOffers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
