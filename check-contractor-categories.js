const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkCategories() {
  console.log('Checking contractor categories in database...\n')

  const { data: contractors, error } = await supabase
    .from('pro_contractors')
    .select('id, name, business_name, categories')
    .limit(50)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log(`Found ${contractors.length} contractors\n`)

  // Collect all unique categories
  const allCategories = new Set()

  contractors.forEach(c => {
    console.log(`${c.business_name || c.name}:`, c.categories)
    if (Array.isArray(c.categories)) {
      c.categories.forEach(cat => allCategories.add(cat))
    }
  })

  console.log('\n=== UNIQUE CATEGORIES IN DATABASE ===')
  console.log(Array.from(allCategories).sort())

  console.log('\n=== EMERGENCY TYPE MAPPING (what we filter by) ===')
  console.log({
    'plumbing': 'Plumbing',
    'electrical': 'Electrical',
    'hvac': 'HVAC',
    'roofing': 'Roofing',
    'water-damage': 'Plumbing',
    'locksmith': 'Locksmith',
    'appliance': 'Appliance Repair',
  })

  console.log('\nIf the mapped values don\'t match the database categories, filtering will fail!')
}

checkCategories().catch(console.error)
