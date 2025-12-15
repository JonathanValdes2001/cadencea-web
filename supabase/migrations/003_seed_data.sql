-- Insert sample products for testing and demonstration
INSERT INTO products (name, description, price, is_active) VALUES
  (
    'Cadencea Vault Pro License',
    'Professional music project management and cloud backup solution with unlimited storage and advanced collaboration features.',
    99.00,
    true
  ),
  (
    'Cloud Storage Upgrade (1TB)',
    'Additional 1TB of secure cloud storage for your music projects and samples.',
    19.99,
    true
  ),
  (
    'Cadencea Vault Starter',
    'Essential music project management tools with 50GB cloud storage.',
    29.99,
    true
  ),
  (
    'Premium Sample Library',
    'Curated collection of high-quality samples and loops from professional producers.',
    49.99,
    true
  ),
  (
    'Advanced Mixing Templates',
    'Professional mixing and mastering templates for major DAWs.',
    39.99,
    true
  );

-- Insert a sample newsletter subscription for testing
INSERT INTO newsletter_subscriptions (email, status, confirmed_at) VALUES
  ('test@example.com', 'confirmed', NOW());

-- Note: Orders and user data will be created dynamically when users sign up and make purchases
-- The profiles table will be populated automatically when users register through the auth trigger
