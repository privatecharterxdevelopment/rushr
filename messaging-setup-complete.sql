-- Complete messaging system setup including storage bucket and sample data

-- First run the main messaging system setup
-- You should run messaging-system-setup.sql first

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for message attachments
CREATE POLICY "Authenticated users can upload message attachments" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "Users can view message attachments in their conversations" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'message-attachments' AND
  EXISTS (
    SELECT 1 FROM message_attachments ma
    JOIN messages m ON ma.message_id = m.id
    JOIN conversations c ON m.conversation_id = c.id
    WHERE ma.file_url LIKE '%' || name || '%'
    AND (c.homeowner_id = auth.uid() OR c.pro_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their own message attachments" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'message-attachments' AND
  EXISTS (
    SELECT 1 FROM message_attachments ma
    JOIN messages m ON ma.message_id = m.id
    WHERE ma.file_url LIKE '%' || name || '%'
    AND m.sender_id = auth.uid()
  )
);

-- Create sample conversations and messages (optional - for testing)
-- Note: You'll need actual user IDs from your auth.users table

-- Function to create sample data (call this after you have users)
CREATE OR REPLACE FUNCTION create_sample_messaging_data(
  homeowner_user_id UUID,
  pro_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  conv_id UUID;
  msg_id UUID;
BEGIN
  -- Create a sample conversation
  INSERT INTO conversations (homeowner_id, pro_id, title, job_id)
  VALUES (homeowner_user_id, pro_user_id, 'AC Unit Repair Request', 'job_123')
  RETURNING id INTO conv_id;

  -- Create sample messages
  INSERT INTO messages (conversation_id, sender_id, message_type, content)
  VALUES
    (conv_id, homeowner_user_id, 'text', 'Hi, my AC unit stopped working this morning. Can you help?'),
    (conv_id, pro_user_id, 'text', 'Hi! I''d be happy to help. What symptoms are you experiencing?'),
    (conv_id, homeowner_user_id, 'text', 'It''s blowing warm air and there''s a strange noise coming from the unit.'),
    (conv_id, pro_user_id, 'text', 'That sounds like it could be a refrigerant issue or a compressor problem. I can come take a look.')
  RETURNING id INTO msg_id;

  -- Create a sample offer
  INSERT INTO messages (conversation_id, sender_id, message_type, content)
  VALUES (conv_id, pro_user_id, 'offer', 'Diagnostic visit and repair estimate')
  RETURNING id INTO msg_id;

  INSERT INTO message_offers (message_id, title, price, delivery_days, notes)
  VALUES (
    msg_id,
    'AC Diagnostic & Repair',
    150.00,
    1,
    'Includes full system diagnostic, refrigerant check, and detailed repair estimate. If repair is approved, diagnostic fee is credited toward the work.'
  );

  -- Create sample conversation participants
  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
  VALUES
    (conv_id, homeowner_user_id, NOW()),
    (conv_id, pro_user_id, NOW());

  RAISE NOTICE 'Sample messaging data created successfully for conversation ID: %', conv_id;
END;
$$;

-- Create indexes for better real-time performance
CREATE INDEX IF NOT EXISTS conversations_participants_idx ON conversations(homeowner_id, pro_id);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conversation_participants_user_conv_idx ON conversation_participants(user_id, conversation_id);

-- Enable real-time for all messaging tables
ALTER publication supabase_realtime ADD TABLE conversations;
ALTER publication supabase_realtime ADD TABLE messages;
ALTER publication supabase_realtime ADD TABLE message_attachments;
ALTER publication supabase_realtime ADD TABLE message_offers;
ALTER publication supabase_realtime ADD TABLE conversation_participants;

-- Create helpful views for the frontend
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
  ) as unread_messages,
  (
    SELECT m.content
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) as last_message_content
FROM conversations c
LEFT JOIN user_profiles hp ON c.homeowner_id = hp.id
LEFT JOIN user_profiles pp ON c.pro_id = pp.id
WHERE c.homeowner_id = auth.uid() OR c.pro_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON user_conversations TO authenticated;

-- Function to get conversation with full message details
CREATE OR REPLACE FUNCTION get_conversation_with_messages(conversation_id_param UUID)
RETURNS TABLE (
  conversation_data JSON,
  messages_data JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has access to this conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id_param
    AND (homeowner_id = auth.uid() OR pro_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Access denied to conversation';
  END IF;

  RETURN QUERY
  SELECT
    row_to_json(conv.*) as conversation_data,
    COALESCE(
      json_agg(
        json_build_object(
          'id', m.id,
          'conversation_id', m.conversation_id,
          'sender_id', m.sender_id,
          'message_type', m.message_type,
          'content', m.content,
          'metadata', m.metadata,
          'reply_to_id', m.reply_to_id,
          'read_at', m.read_at,
          'created_at', m.created_at,
          'updated_at', m.updated_at,
          'attachments', COALESCE(att.attachments, '[]'::json),
          'offers', COALESCE(off.offers, '[]'::json)
        ) ORDER BY m.created_at
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'::json
    ) as messages_data
  FROM conversations conv
  LEFT JOIN messages m ON conv.id = m.conversation_id
  LEFT JOIN (
    SELECT
      ma.message_id,
      json_agg(
        json_build_object(
          'id', ma.id,
          'file_name', ma.file_name,
          'file_url', ma.file_url,
          'file_type', ma.file_type,
          'file_size', ma.file_size,
          'created_at', ma.created_at
        )
      ) as attachments
    FROM message_attachments ma
    GROUP BY ma.message_id
  ) att ON m.id = att.message_id
  LEFT JOIN (
    SELECT
      mo.message_id,
      json_agg(
        json_build_object(
          'id', mo.id,
          'title', mo.title,
          'price', mo.price,
          'delivery_days', mo.delivery_days,
          'notes', mo.notes,
          'status', mo.status,
          'counter_price', mo.counter_price,
          'counter_days', mo.counter_days,
          'counter_notes', mo.counter_notes,
          'expires_at', mo.expires_at,
          'created_at', mo.created_at,
          'updated_at', mo.updated_at
        )
      ) as offers
    FROM message_offers mo
    GROUP BY mo.message_id
  ) off ON m.id = off.message_id
  WHERE conv.id = conversation_id_param
  GROUP BY conv.id, conv.homeowner_id, conv.pro_id, conv.title, conv.job_id,
           conv.status, conv.last_message_at, conv.created_at, conv.updated_at;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_conversation_with_messages(UUID) TO authenticated;

-- Additional helper function to start a conversation
CREATE OR REPLACE FUNCTION start_conversation(
  other_user_id UUID,
  conversation_title TEXT,
  initial_message TEXT,
  job_id_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
  current_user_role TEXT;
  other_user_role TEXT;
  homeowner_id_param UUID;
  pro_id_param UUID;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role FROM user_profiles WHERE id = auth.uid();

  -- Get other user role
  SELECT role INTO other_user_role FROM user_profiles WHERE id = other_user_id;

  -- Determine homeowner and pro IDs
  IF current_user_role = 'homeowner' AND other_user_role = 'contractor' THEN
    homeowner_id_param := auth.uid();
    pro_id_param := other_user_id;
  ELSIF current_user_role = 'contractor' AND other_user_role = 'homeowner' THEN
    homeowner_id_param := other_user_id;
    pro_id_param := auth.uid();
  ELSE
    RAISE EXCEPTION 'Invalid user roles for conversation. Must be between homeowner and contractor.';
  END IF;

  -- Check if conversation already exists
  SELECT id INTO conv_id
  FROM conversations
  WHERE homeowner_id = homeowner_id_param
  AND pro_id = pro_id_param
  AND (job_id_param IS NULL OR job_id = job_id_param);

  -- Create conversation if it doesn't exist
  IF conv_id IS NULL THEN
    INSERT INTO conversations (homeowner_id, pro_id, title, job_id)
    VALUES (homeowner_id_param, pro_id_param, conversation_title, job_id_param)
    RETURNING id INTO conv_id;
  END IF;

  -- Send initial message if provided
  IF initial_message IS NOT NULL AND initial_message != '' THEN
    INSERT INTO messages (conversation_id, sender_id, message_type, content)
    VALUES (conv_id, auth.uid(), 'text', initial_message);
  END IF;

  RETURN conv_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION start_conversation(UUID, TEXT, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION start_conversation IS 'Start a new conversation between a homeowner and a pro, or return existing conversation ID';
COMMENT ON FUNCTION get_conversation_with_messages IS 'Get a conversation with all its messages, attachments, and offers in a structured format';
COMMENT ON VIEW user_conversations IS 'View of conversations for the current user with summary information';

-- Final message
DO $$
BEGIN
  RAISE NOTICE '=== Messaging System Setup Complete ===';
  RAISE NOTICE 'Tables created: conversations, messages, message_attachments, message_offers, conversation_participants';
  RAISE NOTICE 'Storage bucket created: message-attachments';
  RAISE NOTICE 'Helper functions created: create_sample_messaging_data, get_conversation_with_messages, start_conversation';
  RAISE NOTICE 'Views created: user_conversations';
  RAISE NOTICE 'Real-time subscriptions enabled for all messaging tables';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create some test users (homeowner and pro roles)';
  RAISE NOTICE '2. Optionally run: SELECT create_sample_messaging_data(homeowner_uuid, pro_uuid);';
  RAISE NOTICE '3. Test the messaging interface at /messages/real-time';
END;
$$;