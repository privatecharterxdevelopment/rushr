// Script to delete user from Supabase
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

async function deleteUser(email) {
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
      console.log(`User ${email} not found in auth.users`)
      return
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`)

    // Delete from user_profiles first (if exists)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', user.id)

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error deleting from user_profiles:', profileError)
    } else {
      console.log('Deleted from user_profiles (or didn\'t exist)')
    }

    // Delete from auth.users
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return
    }

    console.log(`✅ Successfully deleted user ${email}`)

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

// Run the deletion
deleteUser('lorenzo.vanza@hotmail.com')
