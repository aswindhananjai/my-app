-- Add memory_image_url column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS memory_image_url TEXT;
