-- Create thoughts table for "Surprise with a thought" feature
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by TEXT NOT NULL CHECK (created_by IN ('Aswin', 'Anu')),
  message TEXT NOT NULL,
  view_count INT DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_thoughts_created_by ON thoughts(created_by);
CREATE INDEX IF NOT EXISTS idx_thoughts_last_viewed ON thoughts(last_viewed_at);
CREATE INDEX IF NOT EXISTS idx_thoughts_created_at ON thoughts(created_at DESC);
