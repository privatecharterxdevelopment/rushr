-- Fix RLS policies for messages table to allow conversation participants to send/read messages

-- Enable RLS on messages table (if not already enabled)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "conversation_participants_read_messages" ON messages;
DROP POLICY IF EXISTS "conversation_participants_send_messages" ON messages;
DROP POLICY IF EXISTS "conversation_participants_update_messages" ON messages;

-- Allow users to read messages from conversations they're part of
CREATE POLICY "conversation_participants_read_messages" ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE homeowner_id = auth.uid() OR pro_id = auth.uid()
    )
  );

-- Allow users to send messages to conversations they're part of
CREATE POLICY "conversation_participants_send_messages" ON messages
  FOR INSERT
  WITH CHECK (
    -- Only verify the user is part of this conversation
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (homeowner_id = auth.uid() OR pro_id = auth.uid())
    )
  );

-- Allow users to update their own messages (e.g., marking as read)
CREATE POLICY "conversation_participants_update_messages" ON messages
  FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE homeowner_id = auth.uid() OR pro_id = auth.uid()
    )
  );
