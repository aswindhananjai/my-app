-- Just us - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- App is pre-configured for Aswin and Anu with passcodes 140297 and 010195

-- Memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('first', 'milestone', 'trip', 'gift', 'moment', 'quote', 'celebration', 'special_day')),
  location TEXT,
  image_url TEXT,
  created_by TEXT DEFAULT 'Aswin',
  updated_by TEXT DEFAULT 'Aswin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);

-- Enable Row Level Security (RLS)
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations since it's a private app for 2 users)
CREATE POLICY "Allow all operations on memories" ON memories
  FOR ALL USING (true) WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
