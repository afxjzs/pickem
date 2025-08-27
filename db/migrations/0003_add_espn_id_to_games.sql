-- Add espn_id field to games table for syncing with ESPN API data
-- This allows us to track which games correspond to which ESPN events

-- Add espn_id column to games table
ALTER TABLE games ADD COLUMN espn_id VARCHAR(100);

-- Create unique index on espn_id to prevent duplicates
CREATE UNIQUE INDEX idx_games_espn_id ON games(espn_id) WHERE espn_id IS NOT NULL;

-- Update the games table upsert logic to use espn_id for conflict resolution
-- This will be handled in the application code
