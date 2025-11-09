// scripts/update-sample-contractors.js
// Updates existing contractors with proper locations and services for testing

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Sample contractor updates with realistic NYC-area locations
const contractorUpdates = [
  {
    business_name: 'Johnson Plumbing & Heating',
    base_zip: '10001',
    latitude: 40.7505,
    longitude: -73.9969,
    specialties: ['Plumbing', 'HVAC', 'Emergency Repairs'],
    categories: ['Plumbing', 'HVAC'],
    hourly_rate: 125,
    emergency_service: true,
    about: 'Licensed master plumber serving Manhattan and surrounding areas. 24/7 emergency service available.',
    years_in_business: 12
  },
  {
    business_name: 'Martinez Electric Solutions',
    base_zip: '11201',
    latitude: 40.6955,
    longitude: -73.989,
    specialties: ['Electrical', 'Panel Upgrades', 'Lighting'],
    categories: ['Electrical'],
    hourly_rate: 115,
    emergency_service: true,
    about: 'Licensed electrician specializing in residential electrical work. Panel upgrades, circuit installations.',
    years_in_business: 8
  },
  {
    business_name: 'Chen Climate Control',
    base_zip: '10018',
    latitude: 40.7557,
    longitude: -73.9925,
    specialties: ['HVAC', 'AC Repair', 'Heating'],
    categories: ['HVAC'],
    hourly_rate: 135,
    emergency_service: true,
    about: 'EPA certified HVAC technician. Residential and commercial heating, cooling, and ventilation.',
    years_in_business: 15
  },
  {
    business_name: 'Rodriguez Roofing & Repair',
    base_zip: '11354',
    latitude: 40.7681,
    longitude: -73.8294,
    specialties: ['Roofing', 'Leak Repair'],
    categories: ['Roofing'],
    hourly_rate: 95,
    emergency_service: true,
    about: 'Professional roofing contractor specializing in emergency leak repairs and maintenance.',
    years_in_business: 10
  },
  {
    business_name: 'Kim Security Services',
    base_zip: '10003',
    latitude: 40.7317,
    longitude: -73.9885,
    specialties: ['Locksmith', 'Emergency Lockout'],
    categories: ['Locksmith'],
    hourly_rate: 85,
    emergency_service: true,
    about: '24/7 emergency locksmith service. Residential and commercial lockouts, rekeying.',
    years_in_business: 7
  },
  {
    business_name: 'Brown General Contracting',
    base_zip: '11215',
    latitude: 40.6673,
    longitude: -73.985,
    specialties: ['Handyman', 'Carpentry', 'Drywall'],
    categories: ['Handyman'],
    hourly_rate: 75,
    emergency_service: false,
    about: 'Professional handyman and carpenter. Interior repairs, custom carpentry, drywall, painting.',
    years_in_business: 6
  },
  {
    business_name: 'Taylor Appliance Repair',
    base_zip: '10128',
    latitude: 40.7794,
    longitude: -73.9496,
    specialties: ['Appliance Repair', 'Refrigerator', 'Washer/Dryer'],
    categories: ['Appliance Repair'],
    hourly_rate: 95,
    emergency_service: true,
    about: 'Certified appliance repair technician. All major brands. Same-day service available.',
    years_in_business: 9
  },
  {
    business_name: 'Wilson Restoration Services',
    base_zip: '10451',
    latitude: 40.8209,
    longitude: -73.9252,
    specialties: ['Water Damage', 'Mold Remediation'],
    categories: ['Water Damage'],
    hourly_rate: 145,
    emergency_service: true,
    about: 'IICRC certified water damage restoration and mold remediation. 24/7 emergency response.',
    years_in_business: 11
  }
]

async function updateContractors() {
  console.log('🚀 Updating existing contractors with sample data...\n')

  // Get existing contractors
  const { data: existingContractors, error: fetchError } = await supabase
    .from('pro_contractors')
    .select('id, name')
    .limit(contractorUpdates.length)

  if (fetchError) {
    console.error('Error fetching contractors:', fetchError)
    process.exit(1)
  }

  if (!existingContractors || existingContractors.length === 0) {
    console.error('No existing contractors found to update')
    process.exit(1)
  }

  console.log(`Found ${existingContractors.length} contractors to update\n`)

  // Update each contractor
  for (let i = 0; i < Math.min(contractorUpdates.length, existingContractors.length); i++) {
    const contractor = existingContractors[i]
    const update = contractorUpdates[i]

    try {
      const { error } = await supabase
        .from('pro_contractors')
        .update(update)
        .eq('id', contractor.id)

      if (error) {
        console.error(`❌ Error updating ${contractor.name}:`, error.message)
        continue
      }

      console.log(`✅ Updated ${contractor.name} → ${update.business_name}`)
      console.log(`   ZIP: ${update.base_zip} | Location: ${update.latitude}, ${update.longitude}`)
      console.log(`   Categories: ${update.categories.join(', ')} | Rate: $${update.hourly_rate}/hr\n`)
    } catch (err) {
      console.error(`❌ Error updating ${contractor.name}:`, err.message)
    }
  }

  console.log('✨ Contractor updates complete!')
  console.log('\nYou can now view them at: http://localhost:3004/find-pro')
}

updateContractors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
