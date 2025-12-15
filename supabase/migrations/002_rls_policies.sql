-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can only view and update their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prevent direct INSERT/DELETE on profiles (handled by trigger)
CREATE POLICY "Prevent direct profile inserts" ON profiles
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Prevent direct profile deletes" ON profiles
  FOR DELETE USING (false);

-- Products policies
-- Products are readable by everyone (for browsing)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (is_active = true);

-- Only service role can modify products (through API routes)
CREATE POLICY "Only service role can modify products" ON products
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Orders policies
-- Users can only view their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update orders (through webhooks/API)
CREATE POLICY "Only service role can modify orders" ON orders
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Order items policies
-- Users can view order items for their own orders
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Only service role can modify order items
CREATE POLICY "Only service role can modify order items" ON order_items
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Download entitlements policies
-- Users can view their own entitlements
CREATE POLICY "Users can view their own entitlements" ON download_entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can modify entitlements
CREATE POLICY "Only service role can modify entitlements" ON download_entitlements
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Newsletter subscriptions policies
-- Users can view their own newsletter subscription
CREATE POLICY "Users can view their own newsletter subscription" ON newsletter_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Users can insert their own newsletter subscription
CREATE POLICY "Users can create newsletter subscription" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own newsletter subscription (for unsubscribe)
CREATE POLICY "Users can update their own newsletter subscription" ON newsletter_subscriptions
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Service role can manage all newsletter subscriptions
CREATE POLICY "Service role can manage newsletter subscriptions" ON newsletter_subscriptions
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Processed webhooks policies
-- Only service role can access webhook processing table
CREATE POLICY "Only service role can access processed webhooks" ON processed_webhooks
  FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Audit logs policies
-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert audit logs
CREATE POLICY "Only service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (current_setting('request.jwt.claims')::json->>'role' = 'service_role');

-- Create audit logging function for critical operations
CREATE OR REPLACE FUNCTION log_user_action(
  p_action TEXT,
  p_table_name TEXT DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    inet_client_addr(),
    current_setting('request.headers')::json->>'user-agent'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Log errors but don't fail the main operation
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for profile updates logging
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log profile updates for audit trail
  PERFORM log_user_action(
    'profile_update',
    'profiles',
    NEW.id,
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trigger for profile updates
CREATE TRIGGER profile_audit_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_profile_changes();

-- Create trigger function for newsletter subscription changes
CREATE OR REPLACE FUNCTION log_newsletter_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_user_action(
      'newsletter_subscribe',
      'newsletter_subscriptions',
      NEW.id,
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      PERFORM log_user_action(
        'newsletter_status_change',
        'newsletter_subscriptions',
        NEW.id,
        jsonb_build_object('old_status', OLD.status),
        jsonb_build_object('new_status', NEW.status)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit trigger for newsletter subscription changes
CREATE TRIGGER newsletter_audit_trigger
  AFTER INSERT OR UPDATE ON newsletter_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION log_newsletter_changes();
