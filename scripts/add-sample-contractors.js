// scripts/add-sample-contractors.js
// Adds sample contractors with proper locations and services for testing

const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Sample contractors with realistic NYC-area locations
const sampleContractors = [
  {
    name: 'Mike Johnson',
    business_name: 'Johnson Plumbing & Heating',
    email: 'mike@johnsonplumbing.com',
    phone: '(212) 555-0101',
    base_zip: '10001',
    latitude: 40.7505,
    longitude: -73.9969,
    specialties: ['Plumbing', 'HVAC', 'Emergency Repairs'],
    categories: ['Plumbing', 'HVAC'],
    hourly_rate: 125,
    emergency_service: true,
    about: 'Licensed master plumber serving Manhattan and surrounding areas. 24/7 emergency service available. Specializing in residential and commercial plumbing repairs.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYP-123456',
    insurance_carrier: 'State Farm',
    years_in_business: 12
  },
  {
    name: 'Sarah Martinez',
    business_name: 'Martinez Electric Solutions',
    email: 'sarah@martinezelectric.com',
    phone: '(718) 555-0202',
    base_zip: '11201',
    latitude: 40.6955,
    longitude: -73.989,
    specialties: ['Electrical', 'Panel Upgrades', 'Lighting'],
    categories: ['Electrical'],
    hourly_rate: 115,
    emergency_service: true,
    about: 'Licensed electrician specializing in residential electrical work. Panel upgrades, circuit installations, lighting design, and emergency repairs.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYE-789012',
    insurance_carrier: 'Liberty Mutual',
    years_in_business: 8
  },
  {
    name: 'Tom Chen',
    business_name: 'Chen Climate Control',
    email: 'tom@chenclimate.com',
    phone: '(212) 555-0303',
    base_zip: '10018',
    latitude: 40.7557,
    longitude: -73.9925,
    specialties: ['HVAC', 'AC Repair', 'Heating', 'Commercial HVAC'],
    categories: ['HVAC', 'Appliance Repair'],
    hourly_rate: 135,
    emergency_service: true,
    about: 'EPA certified HVAC technician. Residential and commercial heating, cooling, and ventilation. Same-day service available.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYH-345678',
    insurance_carrier: 'Progressive',
    years_in_business: 15
  },
  {
    name: 'Lisa Rodriguez',
    business_name: 'Rodriguez Roofing & Repair',
    email: 'lisa@rodriguezroofing.com',
    phone: '(917) 555-0404',
    base_zip: '11354',
    latitude: 40.7681,
    longitude: -73.8294,
    specialties: ['Roofing', 'Leak Repair', 'Roof Replacement'],
    categories: ['Roofing'],
    hourly_rate: 95,
    emergency_service: true,
    about: 'Professional roofing contractor specializing in emergency leak repairs, roof replacements, and maintenance. Free estimates available.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYR-901234',
    insurance_carrier: 'Allstate',
    years_in_business: 10
  },
  {
    name: 'David Kim',
    business_name: 'Kim Security Services',
    email: 'david@kimsecurity.com',
    phone: '(646) 555-0505',
    base_zip: '10003',
    latitude: 40.7317,
    longitude: -73.9885,
    specialties: ['Locksmith', 'Emergency Lockout', 'Key Duplication', 'Lock Installation'],
    categories: ['Locksmith'],
    hourly_rate: 85,
    emergency_service: true,
    about: '24/7 emergency locksmith service. Residential and commercial lockouts, rekeying, master key systems, and high-security locks.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYL-567890',
    insurance_carrier: 'Travelers',
    years_in_business: 7
  },
  {
    name: 'Jessica Brown',
    business_name: 'Brown General Contracting',
    email: 'jessica@browngc.com',
    phone: '(718) 555-0606',
    base_zip: '11215',
    latitude: 40.6673,
    longitude: -73.985,
    specialties: ['Handyman', 'Carpentry', 'Drywall', 'Painting'],
    categories: ['Handyman', 'Carpentry'],
    hourly_rate: 75,
    emergency_service: false,
    about: 'Professional handyman and carpenter. Interior repairs, custom carpentry, drywall, painting, and general home maintenance.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYC-234567',
    insurance_carrier: 'Nationwide',
    years_in_business: 6
  },
  {
    name: 'Robert Taylor',
    business_name: 'Taylor Appliance Repair',
    email: 'robert@taylorrepair.com',
    phone: '(212) 555-0707',
    base_zip: '10128',
    latitude: 40.7794,
    longitude: -73.9496,
    specialties: ['Appliance Repair', 'Refrigerator', 'Washer/Dryer', 'Dishwasher'],
    categories: ['Appliance Repair'],
    hourly_rate: 95,
    emergency_service: true,
    about: 'Certified appliance repair technician. All major brands. Same-day service available for most repairs.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYA-890123',
    insurance_carrier: 'GEICO',
    years_in_business: 9
  },
  {
    name: 'Amanda Wilson',
    business_name: 'Wilson Restoration Services',
    email: 'amanda@wilsonrestoration.com',
    phone: '(917) 555-0808',
    base_zip: '10451',
    latitude: 40.8209,
    longitude: -73.9252,
    specialties: ['Water Damage', 'Mold Remediation', 'Emergency Restoration'],
    categories: ['Water Damage'],
    hourly_rate: 145,
    emergency_service: true,
    about: 'IICRC certified water damage restoration and mold remediation. 24/7 emergency response. Insurance claim assistance.',
    status: 'approved',
    kyc_status: 'completed',
    license_number: 'NYW-456789',
    insurance_carrier: 'Farmers',
    years_in_business: 11
  }
]

async function addSampleContractors() {
  console.log('🚀 Adding sample contractors to database...\n')

  for (const contractor of sampleContractors) {
    try {
      // Add UUID for the contractor
      const contractorWithId = {
        id: randomUUID(),
        ...contractor
      }

      // First, insert into pro_contractors table
      const { data, error } = await supabase
        .from('pro_contractors')
        .insert([contractorWithId])
        .select()

      if (error) {
        console.error(`❌ Error adding ${contractor.name}:`, error.message)
        continue
      }

      console.log(`✅ Added ${contractor.name} (${contractor.base_zip})`)
      console.log(`   Business: ${contractor.business_name}`)
      console.log(`   Categories: ${contractor.categories.join(', ')}`)
      console.log(`   Location: ${contractor.latitude}, ${contractor.longitude}`)
      console.log(`   Hourly Rate: $${contractor.hourly_rate}\n`)
    } catch (err) {
      console.error(`❌ Error adding ${contractor.name}:`, err.message)
    }
  }

  console.log('✨ Sample contractors added successfully!')
  console.log('\nYou can now view them at: http://localhost:3004/find-pro')
}

addSampleContractors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
