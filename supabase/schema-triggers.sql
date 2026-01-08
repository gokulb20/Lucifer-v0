-- Lucifer Proactive Trigger System Schema
-- Run this in Supabase SQL editor (after the base schema)

-- Trigger history (log of all triggers that fired)
CREATE TABLE IF NOT EXISTS trigger_history (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL,
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB,
  message_sent TEXT,
  delivery_method TEXT,
  delivered BOOLEAN DEFAULT false,
  user_responded BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ
);

-- VIP contacts for email filtering
CREATE TABLE IF NOT EXISTS vip_contacts (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Known locations for location-based triggers
CREATE TABLE IF NOT EXISTS known_locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER DEFAULT 100,
  trigger_on_arrive BOOLEAN DEFAULT true,
  trigger_on_leave BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'ios',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

-- Chat history (for engagement tracking)
CREATE TABLE IF NOT EXISTS chat_history (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screen time data (from iOS app)
CREATE TABLE IF NOT EXISTS screen_time (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  app_category TEXT,
  app_name TEXT,
  minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trigger_history_trigger ON trigger_history(trigger_id);
CREATE INDEX IF NOT EXISTS idx_trigger_history_fired ON trigger_history(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screen_time_date ON screen_time(date DESC);

-- Insert some default known locations (user can add more)
INSERT INTO known_locations (id, name, lat, lng, radius_meters, trigger_on_arrive) VALUES
  ('loc_gym', 'gym', 0, 0, 150, true),
  ('loc_work', 'work', 0, 0, 100, true),
  ('loc_home', 'home', 0, 0, 100, false)
ON CONFLICT (id) DO NOTHING;
