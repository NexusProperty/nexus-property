-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  related_id UUID,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_notification_type CHECK (type IN (
    'appraisal_status',
    'valuation_complete',
    'report_ready',
    'team_invite',
    'property_access',
    'system_message'
  ))
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appraisal_status BOOLEAN DEFAULT TRUE,
  valuation_complete BOOLEAN DEFAULT TRUE,
  report_ready BOOLEAN DEFAULT TRUE,
  team_invite BOOLEAN DEFAULT TRUE,
  property_access BOOLEAN DEFAULT TRUE,
  system_message BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- Function to initialize user notification preferences
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification preferences for new users
CREATE OR REPLACE TRIGGER create_notification_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_notification_preferences();

-- Set up notification functions
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT NULL,
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_preferences RECORD;
BEGIN
  -- Check user notification preferences
  SELECT * FROM notification_preferences
  WHERE user_id = p_user_id
  INTO v_preferences;
  
  -- If no preferences found, use defaults
  IF v_preferences IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_preferences;
  END IF;
  
  -- Check if the user has enabled this notification type
  IF v_preferences.in_app_notifications = TRUE AND
     (CASE
       WHEN p_type = 'appraisal_status' THEN v_preferences.appraisal_status
       WHEN p_type = 'valuation_complete' THEN v_preferences.valuation_complete
       WHEN p_type = 'report_ready' THEN v_preferences.report_ready
       WHEN p_type = 'team_invite' THEN v_preferences.team_invite
       WHEN p_type = 'property_access' THEN v_preferences.property_access
       WHEN p_type = 'system_message' THEN v_preferences.system_message
       ELSE TRUE
     END) = TRUE THEN
    
    -- Create the notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      related_id,
      related_type
    ) VALUES (
      p_user_id,
      p_type,
      p_title,
      p_message,
      COALESCE(p_metadata, '{}'::JSONB),
      p_related_id,
      p_related_type
    ) RETURNING id INTO v_notification_id;
    
    -- Return the new notification ID
    RETURN v_notification_id;
  END IF;
  
  -- Return NULL if notification not created
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a notification for appraisal status changes
CREATE OR REPLACE FUNCTION create_appraisal_status_notification(
  p_appraisal_id UUID,
  p_status VARCHAR,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_appraisal RECORD;
  v_title TEXT;
  v_message TEXT;
  v_notification_id UUID;
BEGIN
  -- Get the appraisal details
  SELECT * FROM appraisals
  WHERE id = p_appraisal_id
  INTO v_appraisal;
  
  IF v_appraisal IS NULL THEN
    RAISE EXCEPTION 'Appraisal not found';
  END IF;
  
  -- Generate notification title based on status
  CASE
    WHEN p_status = 'draft' THEN
      v_title := 'Appraisal Draft Created';
    WHEN p_status = 'submitted' THEN
      v_title := 'Appraisal Submitted';
    WHEN p_status = 'processing' THEN
      v_title := 'Appraisal Processing';
    WHEN p_status = 'awaiting_valuation' THEN
      v_title := 'Awaiting Valuation';
    WHEN p_status = 'valuation_complete' THEN
      v_title := 'Valuation Complete';
    WHEN p_status = 'generating_report' THEN
      v_title := 'Generating Report';
    WHEN p_status = 'complete' THEN
      v_title := 'Appraisal Complete';
    ELSE
      v_title := 'Appraisal Status Update';
  END CASE;
  
  -- Use provided message or generate a default one
  IF p_message IS NULL THEN
    v_message := 'The appraisal for ' || v_appraisal.property_address || ' has been updated to ' || p_status;
  ELSE
    v_message := p_message;
  END IF;
  
  -- Create the notification
  v_notification_id := create_notification(
    v_appraisal.user_id,
    'appraisal_status',
    v_title,
    v_message,
    jsonb_build_object(
      'appraisal_id', p_appraisal_id,
      'status', p_status,
      'property_address', v_appraisal.property_address
    ),
    p_appraisal_id,
    'appraisal'
  );
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy for notifications: users can only see their own notifications
CREATE POLICY notifications_policy ON notifications
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS policy for notification preferences: users can only see their own preferences
CREATE POLICY notification_preferences_policy ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_status_idx ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS notifications_related_id_idx ON notifications(related_id); 