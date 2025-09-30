const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Hardcoded for now - from .env file
const supabaseUrl = 'https://jtrxdcccswdwlritgstp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cnhkY2Njc3dkd2xyaXRnc3RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0Nzk3ODQsImV4cCI6MjA3NDA1NTc4NH0.v8X7H4vwS4hlwg6JNnuZxXKqonnof_ozc3x1sEi0bck'

console.log('Connecting to Supabase...')
console.log('URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('homeowner-dashboard-setup.sql', 'utf8')

    // Split by semicolons to get individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0)

    console.log(`Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement.length === 0) continue

      console.log(`\nExecuting statement ${i + 1}/${statements.length}...`)
      console.log(statement.substring(0, 100) + '...')

      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement })

        if (error) {
          console.error('SQL Error:', error)
        } else {
          console.log('✓ Success')
        }
      } catch (err) {
        console.error('Error executing statement:', err.message)
      }
    }

    console.log('\nDatabase setup completed!')

  } catch (error) {
    console.error('Error reading SQL file:', error)
  }
}

executeSQL()