-- Fix RLS policies for conversations and conversation_participants
-- Allow automatic creation when bid is accepted

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their participations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can create participations" ON conversation_participants;

-- Conversations policies
CREATE POLICY "homeowners_view_own_conversations"
ON conversations FOR SELECT
TO authenticated
USING (homeowner_id = auth.uid() OR pro_id = auth.uid());

CREATE POLICY "users_create_conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (homeowner_id = auth.uid() OR pro_id = auth.uid());

CREATE POLICY "users_update_own_conversations"
ON conversations FOR UPDATE
TO authenticated
USING (homeowner_id = auth.uid() OR pro_id = auth.uid())
WITH CHECK (homeowner_id = auth.uid() OR pro_id = auth.uid());

-- Conversation participants policies - allow system to create via triggers
CREATE POLICY "users_view_own_participations"
ON conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "system_create_participations"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow trigger-based creation

CREATE POLICY "users_update_own_participations"
ON conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
