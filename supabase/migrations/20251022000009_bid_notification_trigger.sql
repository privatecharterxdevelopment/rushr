-- Create function to notify homeowner when contractor bids on their job
CREATE OR REPLACE FUNCTION notify_homeowner_on_new_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_job_title TEXT;
  v_contractor_name TEXT;
BEGIN
  -- Get job title
  SELECT title INTO v_job_title
  FROM homeowner_jobs
  WHERE id = NEW.job_id;

  -- Get contractor name
  SELECT name INTO v_contractor_name
  FROM pro_contractors
  WHERE id = NEW.contractor_id;

  -- Insert notification for homeowner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    is_read,
    created_at
  ) VALUES (
    NEW.homeowner_id,
    'bid_received',
    'New Bid Received',
    format('"%s" has bid $%s on your job "%s"',
      COALESCE(v_contractor_name, 'A contractor'),
      NEW.bid_amount::TEXT,
      COALESCE(v_job_title, 'your job')
    ),
    format('/dashboard/homeowner/bids?job_id=%s', NEW.job_id),
    false,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to fire when new bid is inserted
DROP TRIGGER IF EXISTS trigger_notify_homeowner_on_bid ON job_bids;
CREATE TRIGGER trigger_notify_homeowner_on_bid
  AFTER INSERT ON job_bids
  FOR EACH ROW
  EXECUTE FUNCTION notify_homeowner_on_new_bid();

-- Add comment
COMMENT ON FUNCTION notify_homeowner_on_new_bid() IS 'Sends notification to homeowner when contractor submits a bid';

<system-reminder>
Background Bash efce45 (command: export PATH="/tmp/node-v20.18.2-darwin-x64/bin:/Users/x/Downloads/rushr-main/node_modules/.bin:/usr/bin:/bin:$PATH" && PORT=3007 /tmp/node-v20.18.2-darwin-x64/bin/npm run dev) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash f11868 (command: export PATH="/tmp/node-v20.18.2-darwin-x64/bin:/Users/x/Downloads/rushr-main/node_modules/.bin:/usr/bin:/bin:$PATH" && PORT=3008 /tmp/node-v20.18.2-darwin-x64/bin/npm run dev) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash 69aa57 (command: export PATH="/tmp/node-v20.18.2-darwin-x64/bin:/Users/x/Downloads/rushr-main/node_modules/.bin:/usr/bin:/bin:$PATH" && PORT=3009 /tmp/node-v20.18.2-darwin-x64/bin/npm run dev) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>

<system-reminder>
Background Bash 65f8b5 (command: export PATH="/usr/bin:/bin:/usr/local/bin:/opt/homebrew/bin:$PATH" && brew install supabase/tap/supabase) (status: running) Has new output available. You can check its output using the BashOutput tool.
</system-reminder>