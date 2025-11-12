const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function quickTest() {
  console.log('Testing login with: jacob@spgroup.com')
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'jacob@spgroup.com',
    password: 'rush#2024'
  })

  if (error) {
    console.error('Login failed:', error.message)
  } else {
    console.log('✅ Login successful!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
  }
  
  await supabase.auth.signOut()
}

quickTest()
