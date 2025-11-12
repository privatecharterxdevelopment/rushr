/**
 * Debug script to see what direct offers exist and their status
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugDirectOffers() {
  console.log('🔍 Fetching all direct offers...\n')

  const { data: offers, error } = await supabase
    .from('direct_offers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${offers.length} direct offers:\n`)

  offers.forEach((offer, i) => {
    console.log(`${i + 1}. Offer ID: ${offer.id}`)
    console.log(`   Job ID: ${offer.job_id}`)
    console.log(`   Homeowner: ${offer.homeowner_id}`)
    console.log(`   Contractor: ${offer.contractor_id}`)
    console.log(`   Status: ${offer.status}`)
    console.log(`   Contractor Response: ${offer.contractor_response}`)
    console.log(`   Amount: $${offer.offered_amount}`)
    console.log(`   Created: ${offer.created_at}`)
    console.log('')
  })

  // Also check conversations
  console.log('\n🔍 Fetching all conversations...\n')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })

  console.log(`Found ${conversations?.length || 0} conversations:\n`)

  conversations?.forEach((conv, i) => {
    console.log(`${i + 1}. Conversation ID: ${conv.id}`)
    console.log(`   Job ID: ${conv.job_id}`)
    console.log(`   Homeowner: ${conv.homeowner_id}`)
    console.log(`   Pro: ${conv.pro_id}`)
    console.log(`   Title: ${conv.title}`)
    console.log(`   Status: ${conv.status}`)
    console.log('')
  })
}

debugDirectOffers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
