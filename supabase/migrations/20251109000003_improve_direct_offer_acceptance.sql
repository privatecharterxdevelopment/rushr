-- =============================================================================
-- IMPROVE DIRECT OFFER ACCEPTANCE FLOW
-- Auto-create conversation when offer is accepted (matching bid acceptance flow)
-- =============================================================================

-- Update accept_direct_offer to create conversation automatically
CREATE OR REPLACE FUNCTION accept_direct_offer(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_conversation_id UUID;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Offer is no longer pending';
  END IF;

  -- Update offer
  UPDATE direct_offers
  SET
    contractor_response = 'accepted',
    status = 'accepted',
    final_agreed_amount = offered_amount,
    final_agreed_duration_hours = estimated_duration_hours,
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_offer_id;

  -- AUTO-CREATE CONVERSATION (matching accept_job_bid behavior)
  -- This allows homeowner and contractor to message immediately
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    job_id,
    title,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_offer.homeowner_id,
    v_offer.contractor_id,
    NULL, -- No job yet, it's just an offer
    v_offer.title,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message if new conversation was created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NULL, -- System message
      'system',
      'Offer accepted for "' || v_offer.title || '" ($' || v_offer.offered_amount || '). You can now discuss project details.',
      NOW()
    );
  END IF;
END;
$$;

-- Update accept_counter_bid to also create conversation
CREATE OR REPLACE FUNCTION accept_counter_bid(p_offer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offer RECORD;
  v_conversation_id UUID;
BEGIN
  -- Get offer details
  SELECT * INTO v_offer FROM direct_offers WHERE id = p_offer_id;

  IF v_offer.id IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.contractor_response != 'counter_bid' THEN
    RAISE EXCEPTION 'No counter-bid exists';
  END IF;

  -- Accept counter-bid
  UPDATE direct_offers
  SET
    homeowner_accepted_counter = true,
    status = 'agreement_reached',
    final_agreed_amount = counter_bid_amount,
    final_agreed_duration_hours = counter_bid_duration_hours,
    updated_at = NOW()
  WHERE id = p_offer_id;

  -- AUTO-CREATE CONVERSATION
  INSERT INTO conversations (
    homeowner_id,
    pro_id,
    job_id,
    title,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_offer.homeowner_id,
    v_offer.contractor_id,
    NULL,
    v_offer.title,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (homeowner_id, pro_id, job_id) DO NOTHING
  RETURNING id INTO v_conversation_id;

  -- Send initial system message if new conversation was created
  IF v_conversation_id IS NOT NULL THEN
    INSERT INTO messages (
      conversation_id,
      sender_id,
      message_type,
      content,
      created_at
    ) VALUES (
      v_conversation_id,
      NULL,
      'system',
      'Counter-offer accepted for "' || v_offer.title || '" ($' || v_offer.counter_bid_amount || '). You can now discuss project details.',
      NOW()
    );
  END IF;
END;
$$;

-- Add comments
COMMENT ON FUNCTION accept_direct_offer IS 'Accept direct offer and auto-create conversation between homeowner and contractor';
COMMENT ON FUNCTION accept_counter_bid IS 'Accept counter-bid and auto-create conversation';

SELECT 'Direct offer acceptance improved - now auto-creates conversations!' as status;
