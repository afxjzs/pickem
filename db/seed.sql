-- Seed data for Pick'em MVP testing
-- Sample NFL Week 1 data

-- Insert sample users
INSERT INTO users (id, email, display_name, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@pickemapp.com', 'Admin User', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'user1@example.com', 'John Doe', FALSE),
('550e8400-e29b-41d4-a716-446655440003', 'user2@example.com', 'Jane Smith', FALSE),
('550e8400-e29b-41d4-a716-446655440004', 'user3@example.com', 'Bob Johnson', FALSE);

-- -- Insert sample NFL Week 1 games (2024 season)
-- INSERT INTO games (id, season, week, home_team, away_team, start_time, is_snf, is_mnf, spread) VALUES
-- ('550e8400-e29b-41d4-a716-446655440010', '2024', 1, 'Kansas City Chiefs', 'Baltimore Ravens', '2024-09-05 20:20:00+00', FALSE, FALSE, -3.5),
-- ('550e8400-e29b-41d4-a716-446655440011', '2024', 1, 'Green Bay Packers', 'Minnesota Vikings', '2024-09-08 13:00:00+00', FALSE, FALSE, -2.0),
-- ('550e8400-e29b-41d4-a716-446655440012', '2024', 1, 'New England Patriots', 'Cincinnati Bengals', '2024-09-08 13:00:00+00', FALSE, FALSE, 6.5),
-- ('550e8400-e29b-41d4-a716-446655440013', '2024', 1, 'Buffalo Bills', 'Arizona Cardinals', '2024-09-08 13:00:00+00', FALSE, FALSE, -7.0),
-- ('550e8400-e29b-41d4-a716-446655440014', '2024', 1, 'Dallas Cowboys', 'Cleveland Browns', '2024-09-08 16:25:00+00', FALSE, FALSE, -4.5),
-- ('550e8400-e29b-41d4-a716-446655440015', '2024', 1, 'Los Angeles Rams', 'Detroit Lions', '2024-09-08 20:20:00+00', TRUE, FALSE, 1.5),
-- ('550e8400-e29b-41d4-a716-446655440016', '2024', 1, 'New York Jets', 'Carolina Panthers', '2024-09-09 20:15:00+00', FALSE, TRUE, -3.0);

-- -- Insert sample picks for users
-- INSERT INTO picks (user_id, game_id, picked_team, confidence_points) VALUES
-- -- User 1 picks
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'Kansas City Chiefs', 7),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', 'Green Bay Packers', 6),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'Cincinnati Bengals', 5),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440013', 'Buffalo Bills', 4),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440014', 'Dallas Cowboys', 3),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440015', 'Los Angeles Rams', 2),
-- ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440016', 'New York Jets', 1),

-- -- User 2 picks
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'Baltimore Ravens', 7),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440011', 'Minnesota Vikings', 6),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440012', 'Cincinnati Bengals', 5),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440013', 'Buffalo Bills', 4),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440014', 'Cleveland Browns', 3),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440015', 'Detroit Lions', 2),
-- ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440016', 'New York Jets', 1),

-- -- User 3 picks
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440010', 'Kansas City Chiefs', 7),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440011', 'Green Bay Packers', 6),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440012', 'New England Patriots', 5),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440013', 'Buffalo Bills', 4),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440014', 'Dallas Cowboys', 3),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440015', 'Los Angeles Rams', 2),
-- ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440016', 'Carolina Panthers', 1);

-- -- Insert sample payments
-- INSERT INTO payments (user_id, stripe_payment_id, amount_cents, status, payment_type, week, season) VALUES
-- ('550e8400-e29b-41d4-a716-446655440002', 'pi_weekly_001', 500, 'succeeded', 'weekly', 1, '2024'),
-- ('550e8400-e29b-41d4-a716-446655440003', 'pi_weekly_002', 500, 'succeeded', 'weekly', 1, '2024'),
-- ('550e8400-e29b-41d4-a716-446655440004', 'pi_weekly_003', 500, 'succeeded', 'weekly', 1, '2024');

-- -- Insert sample scores (assuming some games have results)
-- INSERT INTO scores (user_id, week, season, points, correct_picks, total_picks) VALUES
-- ('550e8400-e29b-41d4-a716-446655440002', 1, '2024', 0, 0, 7),
-- ('550e8400-e29b-41d4-a716-446655440003', 1, '2024', 0, 0, 7),
-- ('550e8400-e29b-41d4-a716-446655440004', 1, '2024', 0, 0, 7);
