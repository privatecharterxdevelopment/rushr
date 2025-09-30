-- Add support for message and conversation deletion

-- Update the messages table to support soft deletion through metadata
-- (The metadata JSONB field already exists, so we just need to update RLS policies)

-- Add a new status for deleted conversations
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('active', 'archived', 'closed', 'deleted'));

-- Update RLS policies to filter out deleted messages and conversations by default
-- Users can still see deleted messages they sent (for transparency)

-- Update conversations policy to exclude deleted conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    (auth.uid() = homeowner_id OR auth.uid() = pro_id)
    AND status != 'deleted'
  );

-- Allow users to update conversation status (for deletion/archiving)
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = homeowner_id OR auth.uid() = pro_id
  );

-- Update messages policy to allow users to update their own messages (for deletion)
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create a function to check if a message can be deleted by the user
CREATE OR REPLACE FUNCTION can_delete_message(
  message_id_param UUID,
  user_id_param UUID DEFAULT auth.uid(),
  time_limit_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  message_record RECORD;
  message_age_hours INTEGER;
BEGIN
  -- Get the message
  SELECT sender_id, created_at INTO message_record
  FROM messages
  WHERE id = message_id_param;

  -- Check if message exists and user is the sender
  IF NOT FOUND OR message_record.sender_id != user_id_param THEN
    RETURN FALSE;
  END IF;

  -- Check if message is within time limit
  message_age_hours := EXTRACT(EPOCH FROM (NOW() - message_record.created_at)) / 3600;

  RETURN message_age_hours < time_limit_hours;
END;
$$;

-- Create a function to soft delete a message
CREATE OR REPLACE FUNCTION soft_delete_message(message_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user can delete this message
  IF NOT can_delete_message(message_id_param) THEN
    RAISE EXCEPTION 'You cannot delete this message';
  END IF;

  -- Update the message to mark it as deleted
  UPDATE messages
  SET
    content = '[Message deleted]',
    metadata = COALESCE(metadata, '{}'::jsonb) ||
               jsonb_build_object(
                 'deleted', true,
                 'deleted_at', NOW(),
                 'deleted_by', auth.uid()
               )
  WHERE id = message_id_param;

  RETURN TRUE;
END;
$$;

-- Create a function to delete a conversation (soft delete)
CREATE OR REPLACE FUNCTION delete_conversation_for_user(conversation_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id_param
    AND (homeowner_id = auth.uid() OR pro_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You cannot delete this conversation';
  END IF;

  -- Mark conversation as deleted
  UPDATE conversations
  SET status = 'deleted'
  WHERE id = conversation_id_param;

  RETURN TRUE;
END;
$$;

-- Create a function to archive a conversation
CREATE OR REPLACE FUNCTION archive_conversation_for_user(conversation_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is participant in this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id_param
    AND (homeowner_id = auth.uid() OR pro_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'You cannot archive this conversation';
  END IF;

  -- Mark conversation as archived
  UPDATE conversations
  SET status = 'archived'
  WHERE id = conversation_id_param;

  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_delete_message(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_conversation_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_conversation_for_user(UUID) TO authenticated;

-- Update the user_conversations view to exclude deleted conversations
DROP VIEW IF EXISTS user_conversations;
CREATE OR REPLACE VIEW user_conversations AS
SELECT
  c.*,
  hp.name as homeowner_name,
  hp.email as homeowner_email,
  pp.name as pro_name,
  pp.email as pro_email,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
  ) as total_messages,
  (
    SELECT COUNT(*)
    FROM messages m
    WHERE m.conversation_id = c.id
    AND m.sender_id != auth.uid()
    AND m.read_at IS NULL
    AND NOT COALESCE((m.metadata->>'deleted')::boolean, false)
  ) as unread_messages,
  (
    SELECT m.content
    FROM messages m
    WHERE m.conversation_id = c.id
    AND NOT COALESCE((m.metadata->>'deleted')::boolean, false)
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message_content
FROM conversations c
LEFT JOIN user_profiles hp ON c.homeowner_id = hp.id
LEFT JOIN user_profiles pp ON c.pro_id = pp.id
WHERE (c.homeowner_id = auth.uid() OR c.pro_id = auth.uid())
AND c.status != 'deleted';

-- Create an admin view to see deleted conversations (for moderation)
CREATE OR REPLACE VIEW admin_deleted_conversations AS
SELECT
  c.*,
  hp.name as homeowner_name,
  hp.email as homeowner_email,
  pp.name as pro_name,
  pp.email as pro_email
FROM conversations c
LEFT JOIN user_profiles hp ON c.homeowner_id = hp.id
LEFT JOIN user_profiles pp ON c.pro_id = pp.id
WHERE c.status = 'deleted';

-- Only allow admin access to this view
-- Note: You'll need to set up an admin role in your RLS policies

-- Create a cleanup function to permanently delete old deleted messages
CREATE OR REPLACE FUNCTION cleanup_deleted_messages(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete messages that have been soft-deleted for more than X days
  WITH deleted_messages AS (
    DELETE FROM messages
    WHERE COALESCE((metadata->>'deleted')::boolean, false) = true
    AND (metadata->>'deleted_at')::timestamp < NOW() - INTERVAL '1 day' * days_old
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_messages;

  RAISE NOTICE 'Permanently deleted % old deleted messages', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Create a cleanup function for deleted conversations
CREATE OR REPLACE FUNCTION cleanup_deleted_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete conversations that have been deleted for more than X days
  WITH deleted_conversations AS (
    DELETE FROM conversations
    WHERE status = 'deleted'
    AND updated_at < NOW() - INTERVAL '1 day' * days_old
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_conversations;

  RAISE NOTICE 'Permanently deleted % old deleted conversations', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions for cleanup functions (typically only for admin/cron jobs)
GRANT EXECUTE ON FUNCTION cleanup_deleted_messages(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_deleted_conversations(INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION soft_delete_message IS 'Soft delete a message by marking it as deleted in metadata. Only works within 24 hours of sending.';
COMMENT ON FUNCTION delete_conversation_for_user IS 'Soft delete a conversation by changing status to deleted. User must be a participant.';
COMMENT ON FUNCTION archive_conversation_for_user IS 'Archive a conversation by changing status to archived. User must be a participant.';
COMMENT ON FUNCTION cleanup_deleted_messages IS 'Permanently delete messages that have been soft-deleted for more than specified days (default 30).';
COMMENT ON FUNCTION cleanup_deleted_conversations IS 'Permanently delete conversations that have been deleted for more than specified days (default 90).';

-- Final message
DO $$
BEGIN
  RAISE NOTICE '=== Message and Conversation Deletion Features Added ===';
  RAISE NOTICE 'New functions:';
  RAISE NOTICE '- soft_delete_message(message_id) - Delete messages within 24 hours';
  RAISE NOTICE '- delete_conversation_for_user(conversation_id) - Soft delete conversations';
  RAISE NOTICE '- archive_conversation_for_user(conversation_id) - Archive conversations';
  RAISE NOTICE '- can_delete_message(message_id, user_id, hours) - Check deletion permissions';
  RAISE NOTICE '- cleanup_deleted_messages(days) - Permanent cleanup (admin)';
  RAISE NOTICE '- cleanup_deleted_conversations(days) - Permanent cleanup (admin)';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated views:';
  RAISE NOTICE '- user_conversations now excludes deleted conversations';
  RAISE NOTICE '- admin_deleted_conversations for moderation';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now:';
  RAISE NOTICE '- Delete their own messages within 24 hours';
  RAISE NOTICE '- Archive or delete conversations they participate in';
  RAISE NOTICE '- Deleted content is hidden but preserved for safety';
END;
$$;