-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    job_title TEXT,
    email TEXT,
    phone TEXT,
    phone2 TEXT,
    country TEXT,
    flavor TEXT,
    photo_url TEXT,
    comm_preference TEXT,
    whatsapp_number TEXT,
    interest TEXT,
    notes TEXT,
    ocr_status TEXT,
    ocr_raw TEXT,
    verified BOOLEAN DEFAULT false,
    verification_code TEXT,
    booth_notified BOOLEAN DEFAULT false
);

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'sms', 'whatsapp', 'email', 'staff_notification'
    subject TEXT, -- for email
    body TEXT NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Create inventory table for tracking samples
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE DEFAULT CURRENT_DATE,
    flavor TEXT NOT NULL,
    total INTEGER DEFAULT 200,
    remaining INTEGER DEFAULT 200,
    UNIQUE(date, flavor)
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Policies for leads (allow insert from anon, select/update with service role)
CREATE POLICY "Allow anonymous inserts" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous updates" ON leads FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous selects" ON leads FOR SELECT USING (true);

-- Policies for message_templates (read-only for anon)
CREATE POLICY "Allow anonymous selects" ON message_templates FOR SELECT USING (true);

-- Policies for inventory
CREATE POLICY "Allow anonymous selects" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow anonymous updates" ON inventory FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous inserts" ON inventory FOR INSERT WITH CHECK (true);

-- Insert default message templates
INSERT INTO message_templates (name, type, body) VALUES 
('customer_confirmation_whatsapp', 'whatsapp', 'Hi {{first_name}}! 🍁

Thank you for signing up with CanadaMade at Gulf Expo Dubai.

Your order is ready! Please collect your complimentary {{flavor}} Kettle Chips from our representative.

Enjoy a taste of Canada! 🇨🇦'),

('customer_confirmation_sms', 'sms', 'Hi {{first_name}}! Thank you for signing up with CanadaMade. Your order is ready! Collect your {{flavor}} Kettle Chips from our booth. 🇨🇦'),

('customer_confirmation_email', 'email', 'Hi {{first_name}},

Thank you for signing up with CanadaMade at Gulf Expo Dubai 2026!

YOUR ORDER IS READY

🥔 Flavor: {{flavor}} Kettle Chips

Please visit our booth and collect your complimentary sample from our representative.

Crafted with care in Canada – we hope you enjoy every crunch!

Warm regards,
The CanadaMade Team
canadamade.com 🇨🇦'),

('staff_notification', 'staff_notification', '🍁 NEW SAMPLE REQUEST

👤 {{first_name}} {{last_name}}
🏢 {{company}} - {{job_title}}
📱 {{phone}}
📧 {{email}}
🌍 {{country}}

🥔 FLAVOR: {{flavor}}

📸 Business Card: {{photo_url}}

⏰ Verified: {{timestamp}}

Ready for pickup!');

-- Insert initial inventory for today (all 5 flavors)
INSERT INTO inventory (flavor, total, remaining) VALUES
('Barbeque', 200, 200),
('Dill Pickle', 200, 200),
('Ketchup', 200, 200),
('Sea Salt', 200, 200),
('Salt & Vinegar', 200, 200)
ON CONFLICT (date, flavor) DO NOTHING;

-- Storage policies for business-cards bucket
-- Run these in Storage > Policies
