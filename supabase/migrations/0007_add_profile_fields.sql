-- Add profile fields to users table for onboarding
ALTER TABLE users
	ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
	ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
	ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Update existing users: set username from display_name or email prefix
UPDATE users
SET username = COALESCE(
	display_name,
	SPLIT_PART(email, '@', 1),
	'user_' || SUBSTRING(id::text, 1, 8)
)
WHERE username IS NULL;

-- Create unique index on username (after backfilling)
-- Handle potential duplicates by appending a number
DO $$
DECLARE
	user_record RECORD;
	counter INTEGER;
	new_username VARCHAR(50);
BEGIN
	FOR user_record IN SELECT id, username FROM users WHERE username IS NOT NULL LOOP
		counter := 1;
		new_username := user_record.username;
		
		WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username AND id != user_record.id) LOOP
			new_username := user_record.username || counter;
			counter := counter + 1;
		END LOOP;
		
		IF new_username != user_record.username THEN
			UPDATE users SET username = new_username WHERE id = user_record.id;
		END IF;
	END LOOP;
END $$;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Make username NOT NULL after backfilling
ALTER TABLE users
	ALTER COLUMN username SET NOT NULL;

