const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client with service role key
const supabase = createClient(
  'https://jtrxdcccswdwlritgstp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0cnhkY2Njc3dkd2xyaXRnc3RwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODQ3OTc4NCwiZXhwIjoyMDc0MDU1Nzg0fQ.61ibiXh28F-btZnL6FeRRrIQAzLVrEOBzWXX1EO9Va0'
)

async function applyMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251111000002_add_wizard_fields_to_contractors.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📝 Applying migration: 20251111000002_add_wizard_fields_to_contractors.sql')
    console.log('SQL to execute:')
    console.log(sql)
    console.log('\n🚀 Executing...\n')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try direct approach if exec_sql doesn't exist
      console.log('⚠️  exec_sql RPC not available, trying direct SQL execution...')

      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim().length > 0)

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 100)}...`)
        const { error: stmtError } = await supabase.rpc('exec', { query: statement + ';' })
        if (stmtError) {
          console.error('❌ Error executing statement:', stmtError)
        } else {
          console.log('✅ Statement executed successfully')
        }
      }
    } else {
      console.log('✅ Migration applied successfully!')
      if (data) {
        console.log('Result:', data)
      }
    }

  } catch (err) {
    console.error('❌ Error applying migration:', err)
    process.exit(1)
  }
}

applyMigration()
