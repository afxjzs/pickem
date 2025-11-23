-- Add over_under column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS over_under DECIMAL(5,1);

-- Add comment
COMMENT ON COLUMN games.over_under IS 'Total points over/under line (UX only, not used for scoring)';

