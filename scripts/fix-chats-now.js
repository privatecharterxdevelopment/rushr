/**
 * SIMPLE SCRIPT - Creates chat conversations for jobs with requested contractors
 * Run this: node scripts/fix-chats-now.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixChatsNow() {
  console.log('🔧 Finding all jobs with requested contractors...\n')

  // Get ALL jobs that have a requested_contractor_id
  const { data: jobs, error } = await supabase
    .from('homeowner_jobs')
    .select('*')
    .not('requested_contractor_id', 'is', null)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`Found ${jobs.length} jobs with requested contractors\n`)

  let created = 0
  let skipped = 0

  for (const job of jobs) {
    console.log(`📋 Job: ${job.title} (${job.id})`)
    console.log(`   Homeowner: ${job.homeowner_id}`)
    console.log(`   Contractor: ${job.requested_contractor_id}`)

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('homeowner_id', job.homeowner_id)
      .eq('pro_id', job.requested_contractor_id)
      .eq('job_id', job.id)
      .maybeSingle()

    if (existing) {
      console.log('   ✓ Chat already exists\n')
      skipped++
      continue
    }

    // Create conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        homeowner_id: job.homeowner_id,
        pro_id: job.requested_contractor_id,
        title: job.title,
        job_id: job.id,
        status: 'active'
      })
      .select()
      .single()

    if (convError) {
      console.error('   ❌ Error creating chat:', convError.message)
      continue
    }

    console.log(`   ✅ Created chat! (${conv.id})\n`)
    created++
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✨ Done!`)
  console.log(`   Created: ${created}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${jobs.length}`)
}

fixChatsNow()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })
