/*
  # Add contractor documents storage

  1. New Tables
    - `contractor_documents`
      - `id` (uuid, primary key)
      - `contractor_id` (uuid, foreign key to profiles)
      - `document_type` (text - insurance, license, certification, etc.)
      - `document_name` (text)
      - `document_url` (text)
      - `file_size` (integer)
      - `mime_type` (text)
      - `status` (enum - pending, approved, rejected)
      - `uploaded_at` (timestamp)
      - `verified_at` (timestamp)
      - `verified_by` (uuid, foreign key to profiles)
      - `notes` (text)

  2. Storage
    - Create contractor-documents bucket
    - Add RLS policies for secure access

  3. Security
    - Enable RLS on contractor_documents table
    - Add policies for contractors and admins
*/

-- Create document status enum
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create contractor documents table
CREATE TABLE IF NOT EXISTS contractor_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  file_size integer,
  mime_type text,
  status document_status DEFAULT 'pending',
  uploaded_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contractor_documents_contractor_id ON contractor_documents(contractor_id);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_status ON contractor_documents(status);
CREATE INDEX IF NOT EXISTS idx_contractor_documents_type ON contractor_documents(document_type);

-- Enable RLS
ALTER TABLE contractor_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Contractors can manage own documents"
  ON contractor_documents
  FOR ALL
  TO authenticated
  USING (contractor_id = auth.uid());

CREATE POLICY "Admins can manage all contractor documents"
  ON contractor_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create storage bucket for contractor documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contractor-documents', 'contractor-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Contractors can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contractor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contractor-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can manage all contractor documents"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'contractor-documents' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );