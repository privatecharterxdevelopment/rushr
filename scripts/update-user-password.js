// Script to update user password in Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updatePassword(email, newPassword) {
  try {
    console.log(`Looking for user with email: ${email}`)

    // Get user by email from auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('Error listing users:', listError)
      return
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      console.log(`❌ User ${email} not found in auth.users`)
      return
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`)

    // Update password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (error) {
      console.error('❌ Error updating password:', error)
      return
    }

    console.log(`✅ Successfully updated password for ${email}`)
    console.log(`New password: ${newPassword}`)

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

// Run the password update
updatePassword('lorenzo.vanza@hotmail.com', 'Testadmin123')
