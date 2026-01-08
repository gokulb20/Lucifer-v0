-- Lucifer Supabase Schema
-- Run this in your Supabase SQL editor to set up the tables

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood entries
CREATE TABLE IF NOT EXISTS mood_entries (
  id TEXT PRIMARY KEY,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 1 AND energy <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- People (important relationships)
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  relationship TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preferences (quiz answers)
CREATE TABLE IF NOT EXISTS preferences (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL UNIQUE,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location history
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health data
CREATE TABLE IF NOT EXISTS health_entries (
  id TEXT PRIMARY KEY,
  steps INTEGER,
  sleep_hours DOUBLE PRECISION,
  active_minutes INTEGER,
  heart_rate INTEGER,
  workouts JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  prompt_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity data (from iOS motion)
CREATE TABLE IF NOT EXISTS activity_entries (
  id TEXT PRIMARY KEY,
  activity TEXT NOT NULL,
  confidence DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts sync
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  phone_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos shared
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  image_url TEXT,
  caption TEXT,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_mood_created ON mood_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locations_created ON locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_created ON health_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_created ON journal_entries(created_at DESC);

-- Enable Row Level Security (optional, for multi-user)
-- ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
-- etc.
