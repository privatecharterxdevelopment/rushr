ALTER TABLE homeowner_messages
ADD COLUMN sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;