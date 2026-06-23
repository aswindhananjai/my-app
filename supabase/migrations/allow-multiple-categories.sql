-- Migration to allow multiple categories per memory by dropping the single-category CHECK constraint
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_category_check;
