import { neon } from '@neondatabase/serverless'

// Use Supabase URL for database connection
const databaseUrl = process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  `postgresql://postgres:[password]@db.${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', '')}.supabase.co:5432/postgres`

export const sql = neon(databaseUrl)

export async function ensureSchema() {
  // Basic schema validation/creation can be added here if needed
  // For now, just return success to prevent the API from failing
  return true
}