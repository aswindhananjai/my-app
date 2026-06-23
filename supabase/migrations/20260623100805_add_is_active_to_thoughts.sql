-- Add is_active field to thoughts table for soft delete
ALTER TABLE thoughts
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index on is_active for better query performance
CREATE INDEX idx_thoughts_is_active ON thoughts(is_active);
