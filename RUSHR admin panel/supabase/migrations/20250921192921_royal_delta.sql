/*
  # Add Job Categories Table

  1. New Tables
    - `job_categories`
      - `id` (uuid, primary key)
      - `name` (text, category name)
      - `description` (text, category description)
      - `icon` (text, icon name for UI)
      - `is_active` (boolean, whether category is active)
      - `sort_order` (integer, for ordering categories)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `job_categories` table
    - Add policy for public read access
    - Add policy for admin management

  3. Data
    - Insert all job categories including trucking/towing services
*/

-- Create job categories table
CREATE TABLE IF NOT EXISTS job_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text DEFAULT 'wrench',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_job_categories_active ON job_categories (is_active);
CREATE INDEX IF NOT EXISTS idx_job_categories_sort_order ON job_categories (sort_order);

-- Enable RLS
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read active job categories"
  ON job_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage job categories"
  ON job_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
    )
  );

-- Insert comprehensive job categories
INSERT INTO job_categories (name, description, icon, sort_order) VALUES
-- Core home services from your image
('Plumbing', 'Water systems, pipes, fixtures, and drainage solutions', 'droplets', 1),
('Landscaping', 'Garden design, lawn care, tree services, and outdoor maintenance', 'trees', 2),
('Repair', 'General repairs, maintenance, and fix-it services', 'wrench', 3),
('Painting', 'Interior and exterior painting, wallpaper, and decorative finishes', 'paintbrush', 4),
('Renovation', 'Home remodeling, kitchen and bathroom renovations', 'home', 5),
('Electrical', 'Electrical installations, repairs, and safety inspections', 'zap', 6),
('Roofing', 'Roof repairs, installations, gutters, and weatherproofing', 'triangle', 7),
('Flooring', 'Flooring installation, refinishing, and repairs', 'square', 8),

-- Trucking and towing services
('Towing Services', 'Vehicle towing, roadside assistance, and emergency transport', 'truck', 9),
('Heavy Transport', 'Large vehicle and equipment transportation', 'truck', 10),
('Moving Services', 'Residential and commercial moving, furniture transport', 'package', 11),
('Delivery Services', 'Package delivery, courier services, and logistics', 'package-2', 12),

-- Additional construction and maintenance
('HVAC', 'Heating, ventilation, air conditioning installation and repair', 'thermometer', 13),
('Carpentry', 'Custom woodwork, furniture, cabinets, and structural work', 'hammer', 14),
('Masonry', 'Brickwork, stonework, concrete, and structural masonry', 'brick-wall', 15),
('Insulation', 'Thermal and sound insulation installation and repair', 'shield', 16),
('Windows & Doors', 'Window and door installation, repair, and replacement', 'door-open', 17),
('Drywall', 'Drywall installation, repair, and finishing', 'square', 18),
('Tile Work', 'Ceramic, stone, and decorative tile installation', 'grid-3x3', 19),

-- Specialized services
('Pool Services', 'Pool installation, maintenance, and repair', 'waves', 20),
('Fencing', 'Fence installation, repair, and gate services', 'fence', 21),
('Concrete Work', 'Concrete pouring, finishing, and decorative concrete', 'square', 22),
('Demolition', 'Controlled demolition and debris removal', 'trash-2', 23),
('Pest Control', 'Pest inspection, treatment, and prevention services', 'bug', 24),
('Security Systems', 'Security system installation and monitoring setup', 'shield-check', 25),

-- Automotive and mechanical
('Auto Repair', 'Vehicle maintenance, diagnostics, and mechanical repairs', 'car', 26),
('Tire Services', 'Tire installation, repair, and wheel alignment', 'circle', 27),
('Locksmith', 'Lock installation, repair, and emergency lockout services', 'key', 28),

-- Cleaning and maintenance
('Cleaning Services', 'Residential and commercial cleaning services', 'spray-can', 29),
('Pressure Washing', 'Exterior cleaning, driveway, and building washing', 'droplets', 30),
('Gutter Cleaning', 'Gutter cleaning, repair, and maintenance', 'droplets', 31),
('Chimney Services', 'Chimney cleaning, inspection, and repair', 'flame', 32),

-- Technology and modern services
('Smart Home', 'Home automation, smart device installation and setup', 'smartphone', 33),
('Solar Installation', 'Solar panel installation and renewable energy systems', 'sun', 34),
('Appliance Repair', 'Household appliance repair and maintenance', 'refrigerator', 35),

-- Emergency and specialized
('Emergency Services', 'Emergency repairs and urgent service calls', 'alert-triangle', 36),
('Inspection Services', 'Home inspections, safety checks, and certifications', 'search', 37),
('Consulting', 'Professional consultation and project planning', 'users', 38),

-- Miscellaneous
('Other', 'Services not covered by other categories', 'more-horizontal', 99);

-- Update jobs table to reference job categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN category_id uuid REFERENCES job_categories(id);
    CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON jobs (category_id);
  END IF;
END $$;

-- Update existing jobs to use category IDs (optional - can be done later via admin interface)
-- This will set all existing jobs to 'Other' category
UPDATE jobs 
SET category_id = (SELECT id FROM job_categories WHERE name = 'Other')
WHERE category_id IS NULL;