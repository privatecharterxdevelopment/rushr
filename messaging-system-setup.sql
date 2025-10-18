-- Messaging System Tables for Homeowner-Pro Real-time Communication
-- These tables will be added to the existing Supabase schema

-- Conversations table to manage chat threads between homeowners and pros
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  homeowner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pro_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  job_id TEXT, -- Optional reference to a job posting
  status TEXT CHECK (status IN ('active', 'archived', 'closed')) NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(homeowner_id, pro_id, job_id)
);

-- Messages table to store individual messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'offer', 'system', 'file')) NOT NULL DEFAULT 'text',
  content TEXT,
  metadata JSONB DEFAULT '{}', -- For attachments, offer details, etc.
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers table for pro quotes and homeowner responses
CREATE TABLE IF NOT EXISTS message_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  delivery_days INTEGER NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'expired')) NOT NULL DEFAULT 'pending',
  counter_price DECIMAL(10,2),
  counter_days INTEGER,
  counter_notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation participants tracking (for read receipts and typing indicators)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_typing BOOLEAN DEFAULT FALSE,
  typing_updated_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (auth.uid() = homeowner_id OR auth.uid() = pro_id);

DROP POLICY IF EXISTS "Users can create conversations they participate in" ON conversations;
CREATE POLICY "Users can create conversations they participate in" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = homeowner_id OR auth.uid() = pro_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = homeowner_id OR auth.uid() = pro_id);

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- RLS Policies for message_attachments
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON message_attachments;
CREATE POLICY "Users can view attachments in their conversations" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON messages.conversation_id = conversations.id
      WHERE messages.id = message_attachments.message_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create attachments in their conversations" ON message_attachments;
CREATE POLICY "Users can create attachments in their conversations" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON messages.conversation_id = conversations.id
      WHERE messages.id = message_attachments.message_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

-- RLS Policies for message_offers
DROP POLICY IF EXISTS "Users can view offers in their conversations" ON message_offers;
CREATE POLICY "Users can view offers in their conversations" ON message_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON messages.conversation_id = conversations.id
      WHERE messages.id = message_offers.message_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create offers in their conversations" ON message_offers;
CREATE POLICY "Users can create offers in their conversations" ON message_offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON messages.conversation_id = conversations.id
      WHERE messages.id = message_offers.message_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update offers in their conversations" ON message_offers;
CREATE POLICY "Users can update offers in their conversations" ON message_offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM messages
      JOIN conversations ON messages.conversation_id = conversations.id
      WHERE messages.id = message_offers.message_id
      AND (conversations.homeowner_id = auth.uid() OR conversations.pro_id = auth.uid())
    )
  );

-- RLS Policies for conversation_participants
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;
CREATE POLICY "Users can view their own participation" ON conversation_participants
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own participation" ON conversation_participants;
CREATE POLICY "Users can create their own participation" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participation" ON conversation_participants;
CREATE POLICY "Users can update their own participation" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions and triggers for updated_at timestamps
CREATE TRIGGER handle_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_message_offers_updated_at
  BEFORE UPDATE ON message_offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update conversation last_message_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Function to automatically create conversation participants
CREATE OR REPLACE FUNCTION create_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert homeowner as participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (NEW.id, NEW.homeowner_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Insert pro as participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (NEW.id, NEW.pro_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_participants_on_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION create_conversation_participants();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS conversations_homeowner_id_idx ON conversations(homeowner_id);
CREATE INDEX IF NOT EXISTS conversations_pro_id_idx ON conversations(pro_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(status);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_message_type_idx ON messages(message_type);

CREATE INDEX IF NOT EXISTS message_attachments_message_id_idx ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS message_offers_message_id_idx ON message_offers(message_id);
CREATE INDEX IF NOT EXISTS message_offers_status_idx ON message_offers(status);

CREATE INDEX IF NOT EXISTS conversation_participants_conversation_id_idx ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_participants_user_id_idx ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS conversation_participants_typing_idx ON conversation_participants(is_typing) WHERE is_typing = true;

-- Views for easier querying
CREATE OR REPLACE VIEW conversation_details AS
SELECT
  c.*,
  h.name as homeowner_name,
  h.email as homeowner_email,
  p.name as pro_name,
  p.email as pro_email,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.read_at IS NULL AND m.sender_id != auth.uid()) as unread_count
FROM conversations c
LEFT JOIN user_profiles h ON c.homeowner_id = h.id
LEFT JOIN user_profiles p ON c.pro_id = p.id;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON message_offers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_participants TO authenticated;
GRANT SELECT ON conversation_details TO authenticated;