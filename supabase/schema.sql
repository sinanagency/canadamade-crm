-- CanadaMade Gulf Expo 2026 - Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. LEADS TABLE (Customer signups from QR)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Personal Info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  company VARCHAR(200),
  job_title VARCHAR(100),

  -- Contact Info
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  phone2 VARCHAR(50),
  whatsapp_number VARCHAR(50),
  country VARCHAR(100),

  -- Preferences
  comm_preference VARCHAR(20) CHECK (comm_preference IN ('email', 'whatsapp', 'sms')),
  flavor VARCHAR(50),
  interest TEXT,
  notes TEXT,

  -- Business Card OCR
  photo_url TEXT,
  ocr_raw TEXT,
  ocr_status VARCHAR(20),

  -- Verification
  verification_code VARCHAR(10),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verification_method VARCHAR(20),

  -- Collection Status
  collected BOOLEAN DEFAULT FALSE,
  collected_at TIMESTAMPTZ,
  collected_by VARCHAR(100),

  -- Metadata
  source VARCHAR(100) DEFAULT 'Gulf Expo Dubai 2026 QR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_verified ON leads(verified);
CREATE INDEX IF NOT EXISTS idx_leads_collected ON leads(collected);
CREATE INDEX IF NOT EXISTS idx_leads_flavor ON leads(flavor);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- ============================================
-- 2. INVENTORY TABLE (Sample stock tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flavor VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  emoji VARCHAR(10),
  initial_stock INTEGER DEFAULT 200,
  current_stock INTEGER DEFAULT 200,
  low_stock_threshold INTEGER DEFAULT 20,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default flavors
INSERT INTO inventory (flavor, display_name, emoji, initial_stock, current_stock) VALUES
  ('barbeque', 'Barbeque', '🍖', 200, 200),
  ('dill-pickle', 'Dill Pickle', '🥒', 200, 200),
  ('ketchup', 'Ketchup', '🍅', 200, 200),
  ('salt-vinegar', 'Salt & Vinegar', '🧂', 200, 200),
  ('sea-salt', 'Sea Salt', '🌊', 200, 200)
ON CONFLICT (flavor) DO NOTHING;

-- ============================================
-- 3. INVENTORY LOG (Track all stock changes)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flavor VARCHAR(50) NOT NULL,
  change_type VARCHAR(20) CHECK (change_type IN ('collected', 'adjustment', 'restock', 'initial')),
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  lead_id UUID REFERENCES leads(id),
  reason TEXT,
  staff_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_log_flavor ON inventory_log(flavor);
CREATE INDEX IF NOT EXISTS idx_inventory_log_created_at ON inventory_log(created_at DESC);

-- ============================================
-- 4. STAFF SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS staff_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO staff_settings (setting_key, setting_value) VALUES
  ('pin_code', '2026'),
  ('sound_enabled', 'true'),
  ('whatsapp_notifications', 'true'),
  ('staff_whatsapp_number', ''),
  ('expo_name', 'Gulf Expo Dubai 2026')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- 5. DAILY STATS TABLE (For reporting)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE NOT NULL UNIQUE,
  total_signups INTEGER DEFAULT 0,
  total_verified INTEGER DEFAULT 0,
  total_collected INTEGER DEFAULT 0,

  -- By flavor
  barbeque_collected INTEGER DEFAULT 0,
  dill_pickle_collected INTEGER DEFAULT 0,
  ketchup_collected INTEGER DEFAULT 0,
  salt_vinegar_collected INTEGER DEFAULT 0,
  sea_salt_collected INTEGER DEFAULT 0,

  -- By verification method
  email_verifications INTEGER DEFAULT 0,
  whatsapp_verifications INTEGER DEFAULT 0,
  sms_verifications INTEGER DEFAULT 0,

  -- By hour (JSON object)
  hourly_breakdown JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to decrement inventory when sample collected
CREATE OR REPLACE FUNCTION decrement_inventory(flavor_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  current INTEGER;
BEGIN
  SELECT current_stock INTO current FROM inventory WHERE flavor = flavor_name;

  IF current IS NULL OR current <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE inventory
  SET current_stock = current_stock - 1,
      is_available = (current_stock - 1 > 0)
  WHERE flavor = flavor_name;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get pickup queue (verified but not collected)
CREATE OR REPLACE FUNCTION get_pickup_queue()
RETURNS TABLE (
  id UUID,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  whatsapp_number VARCHAR,
  flavor VARCHAR,
  verified_at TIMESTAMPTZ,
  wait_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.first_name,
    l.last_name,
    l.phone,
    l.whatsapp_number,
    l.flavor,
    l.verified_at,
    EXTRACT(EPOCH FROM (NOW() - l.verified_at))::INTEGER / 60 AS wait_minutes
  FROM leads l
  WHERE l.verified = TRUE AND l.collected = FALSE
  ORDER BY l.verified_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Policies for leads (allow all for service role, insert for anon)
CREATE POLICY "Allow service role full access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow anon insert to leads" ON leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select own lead" ON leads
  FOR SELECT USING (true);

-- Policies for inventory (read for all, write for service role)
CREATE POLICY "Allow read access to inventory" ON inventory
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access to inventory" ON inventory
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for staff_settings (service role only)
CREATE POLICY "Allow service role access to staff_settings" ON staff_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow anon read staff_settings" ON staff_settings
  FOR SELECT USING (true);

-- ============================================
-- 8. REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for leads table (for staff dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- ============================================
-- 9. VIEWS FOR EASY QUERYING
-- ============================================

-- View: Today's pickup queue
CREATE OR REPLACE VIEW pickup_queue AS
SELECT
  l.id,
  l.first_name,
  l.last_name,
  l.phone,
  l.whatsapp_number,
  l.flavor,
  i.display_name AS flavor_display,
  i.emoji AS flavor_emoji,
  l.verified_at,
  EXTRACT(EPOCH FROM (NOW() - l.verified_at))::INTEGER / 60 AS wait_minutes,
  l.comm_preference
FROM leads l
LEFT JOIN inventory i ON l.flavor = i.flavor
WHERE l.verified = TRUE
  AND l.collected = FALSE
  AND l.created_at >= CURRENT_DATE
ORDER BY l.verified_at ASC;

-- View: Today's stats summary
CREATE OR REPLACE VIEW today_stats AS
SELECT
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS total_signups,
  COUNT(*) FILTER (WHERE verified = TRUE AND created_at >= CURRENT_DATE) AS total_verified,
  COUNT(*) FILTER (WHERE collected = TRUE AND created_at >= CURRENT_DATE) AS total_collected,
  COUNT(*) FILTER (WHERE verified = TRUE AND collected = FALSE AND created_at >= CURRENT_DATE) AS waiting
FROM leads;

-- View: Inventory status
CREATE OR REPLACE VIEW inventory_status AS
SELECT
  flavor,
  display_name,
  emoji,
  initial_stock,
  current_stock,
  initial_stock - current_stock AS distributed,
  ROUND((current_stock::NUMERIC / initial_stock::NUMERIC) * 100, 1) AS stock_percentage,
  current_stock <= low_stock_threshold AS is_low_stock,
  is_available
FROM inventory
ORDER BY display_name;

-- ============================================
-- DONE! Run this in Supabase SQL Editor
-- ============================================
