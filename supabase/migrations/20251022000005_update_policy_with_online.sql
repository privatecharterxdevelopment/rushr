-- Update the public_select_approved policy to include 'online' status

DROP POLICY IF EXISTS "public_select_approved" ON pro_contractors;

CREATE POLICY "public_select_approved"
ON pro_contractors
FOR SELECT
TO public
USING (status IN ('approved', 'online'));
