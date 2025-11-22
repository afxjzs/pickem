-- Allow confidence_points to be 0 for incomplete picks
-- This allows users to save just the team selection without assigning points yet

ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_confidence_points_check;
ALTER TABLE picks ADD CONSTRAINT picks_confidence_points_check CHECK (confidence_points >= 0 AND confidence_points <= 16);

