-- Updated seed data for Pick'em MVP testing
-- Generated automatically on 2025-08-27T23:07:40.026Z
-- Contains latest data from ESPN API

-- Insert sample users
INSERT INTO users (id, email, display_name, is_admin) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@pickemapp.com', 'Admin User', TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'user1@example.com', 'John Doe', FALSE),
('550e8400-e29b-41d4-a716-446655440003', 'user2@example.com', 'Jane Smith', FALSE),
('550e8400-e29b-41d4-a716-446655440004', 'user3@example.com', 'Bob Johnson', FALSE);

-- Insert latest teams data
INSERT INTO teams (espn_id, name, abbreviation, display_name, short_display_name, location, primary_color, secondary_color, logo_url, conference, division, active) VALUES
('2', 'Bills', 'BUF', 'Buffalo Bills', 'Bills', 'Buffalo', '00338d', 'd50a0a', 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png', 'AFC', 'East', true),
('15', 'Dolphins', 'MIA', 'Miami Dolphins', 'Dolphins', 'Miami', '008e97', 'fc4c02', 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png', 'AFC', 'East', true),
('20', 'Jets', 'NYJ', 'New York Jets', 'Jets', 'New York', '115740', 'ffffff', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png', 'AFC', 'East', true),
('17', 'Patriots', 'NE', 'New England Patriots', 'Patriots', 'New England', '002a5c', 'c60c30', 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png', 'AFC', 'East', true),
('4', 'Bengals', 'CIN', 'Cincinnati Bengals', 'Bengals', 'Cincinnati', 'fb4f14', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png', 'AFC', 'North', true),
('5', 'Browns', 'CLE', 'Cleveland Browns', 'Browns', 'Cleveland', '472a08', 'ff3c00', 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png', 'AFC', 'North', true),
('33', 'Ravens', 'BAL', 'Baltimore Ravens', 'Ravens', 'Baltimore', '29126f', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png', 'AFC', 'North', true),
('23', 'Steelers', 'PIT', 'Pittsburgh Steelers', 'Steelers', 'Pittsburgh', '000000', 'ffb612', 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png', 'AFC', 'North', true),
('11', 'Colts', 'IND', 'Indianapolis Colts', 'Colts', 'Indianapolis', '003b75', 'ffffff', 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png', 'AFC', 'South', true),
('30', 'Jaguars', 'JAX', 'Jacksonville Jaguars', 'Jaguars', 'Jacksonville', '007487', 'd7a22a', 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png', 'AFC', 'South', true),
('34', 'Texans', 'HOU', 'Houston Texans', 'Texans', 'Houston', '00143f', 'c41230', 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png', 'AFC', 'South', true),
('10', 'Titans', 'TEN', 'Tennessee Titans', 'Titans', 'Tennessee', '4b92db', '002a5c', 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png', 'AFC', 'South', true),
('7', 'Broncos', 'DEN', 'Denver Broncos', 'Broncos', 'Denver', '0a2343', 'fc4c02', 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png', 'AFC', 'West', true),
('24', 'Chargers', 'LAC', 'Los Angeles Chargers', 'Chargers', 'Los Angeles', '0080c6', 'ffc20e', 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png', 'AFC', 'West', true),
('12', 'Chiefs', 'KC', 'Kansas City Chiefs', 'Chiefs', 'Kansas City', 'e31837', 'ffb612', 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png', 'AFC', 'West', true),
('13', 'Raiders', 'LV', 'Las Vegas Raiders', 'Raiders', 'Las Vegas', '000000', 'a5acaf', 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png', 'AFC', 'West', true),
('28', 'Commanders', 'WSH', 'Washington Commanders', 'Commanders', 'Washington', '5a1414', 'ffb612', 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png', 'NFC', 'East', true),
('6', 'Cowboys', 'DAL', 'Dallas Cowboys', 'Cowboys', 'Dallas', '002a5c', 'b0b7bc', 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png', 'NFC', 'East', true),
('21', 'Eagles', 'PHI', 'Philadelphia Eagles', 'Eagles', 'Philadelphia', '06424d', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png', 'NFC', 'East', true),
('19', 'Giants', 'NYG', 'New York Giants', 'Giants', 'New York', '003c7f', 'c9243f', 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png', 'NFC', 'East', true),
('3', 'Bears', 'CHI', 'Chicago Bears', 'Bears', 'Chicago', '0b1c3a', 'e64100', 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png', 'NFC', 'North', true),
('8', 'Lions', 'DET', 'Detroit Lions', 'Lions', 'Detroit', '0076b6', 'bbbbbb', 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png', 'NFC', 'North', true),
('9', 'Packers', 'GB', 'Green Bay Packers', 'Packers', 'Green Bay', '204e32', 'ffb612', 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png', 'NFC', 'North', true),
('16', 'Vikings', 'MIN', 'Minnesota Vikings', 'Vikings', 'Minnesota', '4f2683', 'ffc62f', 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png', 'NFC', 'North', true),
('27', 'Buccaneers', 'TB', 'Tampa Bay Buccaneers', 'Buccaneers', 'Tampa Bay', 'bd1c36', '3e3a35', 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png', 'NFC', 'South', true),
('1', 'Falcons', 'ATL', 'Atlanta Falcons', 'Falcons', 'Atlanta', 'a71930', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png', 'NFC', 'South', true),
('29', 'Panthers', 'CAR', 'Carolina Panthers', 'Panthers', 'Carolina', '0085ca', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png', 'NFC', 'South', true),
('18', 'Saints', 'NO', 'New Orleans Saints', 'Saints', 'New Orleans', 'd3bc8d', '000000', 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png', 'NFC', 'South', true),
('25', '49ers', 'SF', 'San Francisco 49ers', '49ers', 'San Francisco', 'aa0000', 'b3995d', 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png', 'NFC', 'West', true),
('22', 'Cardinals', 'ARI', 'Arizona Cardinals', 'Cardinals', 'Arizona', 'a40227', 'ffffff', 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png', 'NFC', 'West', true),
('14', 'Rams', 'LAR', 'Los Angeles Rams', 'Rams', 'Los Angeles', '003594', 'ffd100', 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png', 'NFC', 'West', true),
('26', 'Seahawks', 'SEA', 'Seattle Seahawks', 'Seahawks', 'Seattle', '002a5c', '69be28', 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png', 'NFC', 'West', true);

-- Insert latest NFL Week 1 games (2025 season)
INSERT INTO games (espn_id, season, week, home_team, away_team, start_time, is_snf, is_mnf, spread) VALUES
('401772510', '2025', 1, 'PHI', 'DAL', '2025-09-05 00:20:00.000+00', false, false, NULL),
('401772714', '2025', 1, 'LAC', 'KC', '2025-09-06 00:00:00.000+00', false, false, NULL),
('401772830', '2025', 1, 'ATL', 'TB', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772829', '2025', 1, 'CLE', 'CIN', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772719', '2025', 1, 'IND', 'MIA', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772720', '2025', 1, 'NE', 'LV', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772718', '2025', 1, 'NO', 'ARI', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772721', '2025', 1, 'NYJ', 'PIT', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772827', '2025', 1, 'WSH', 'NYG', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772828', '2025', 1, 'JAX', 'CAR', '2025-09-07 17:00:00.000+00', false, false, NULL),
('401772832', '2025', 1, 'DEN', 'TEN', '2025-09-07 20:05:00.000+00', false, false, NULL),
('401772831', '2025', 1, 'SEA', 'SF', '2025-09-07 20:05:00.000+00', false, false, NULL),
('401772722', '2025', 1, 'GB', 'DET', '2025-09-07 20:25:00.000+00', false, false, NULL),
('401772723', '2025', 1, 'LAR', 'HOU', '2025-09-07 20:25:00.000+00', false, false, NULL),
('401772918', '2025', 1, 'BUF', 'BAL', '2025-09-08 00:20:00.000+00', false, false, NULL),
('401772810', '2025', 1, 'CHI', 'MIN', '2025-09-09 00:15:00.000+00', false, false, NULL);

-- Insert latest standings data (2025 season)
INSERT INTO standings (team_id, season, conference, wins, losses, ties, win_percentage, points_for, points_against, rank) VALUES
('BUF', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 1),
('MIA', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 2),
('NYJ', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 3),
('NE', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 4),
('CIN', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 5),
('CLE', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 6),
('BAL', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 7),
('PIT', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 8),
('IND', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 9),
('JAX', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 10),
('HOU', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 11),
('TEN', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 12),
('DEN', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 13),
('LAC', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 14),
('KC', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 15),
('LV', '2025', 'AFC', 0, 0, 0, 0, 0, 0, 16),
('WSH', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 1),
('DAL', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 2),
('PHI', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 3),
('NYG', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 4),
('CHI', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 5),
('DET', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 6),
('GB', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 7),
('MIN', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 8),
('TB', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 9),
('ATL', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 10),
('CAR', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 11),
('NO', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 12),
('SF', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 13),
('ARI', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 14),
('LAR', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 15),
('SEA', '2025', 'NFC', 0, 0, 0, 0, 0, 0, 16);

-- Insert sample picks for users (placeholder data)
INSERT INTO picks (user_id, game_id, picked_team, confidence_points) VALUES
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM games WHERE espn_id = '401772510'), 'PHI', 7),
('550e8400-e29b-41d4-a716-446655440003', (SELECT id FROM games WHERE espn_id = '401772510'), 'DAL', 6);

-- Insert sample payments
INSERT INTO payments (user_id, stripe_payment_id, amount_cents, status, payment_type, week, season) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'pi_weekly_001', 500, 'succeeded', 'weekly', 1, '2025'),
('550e8400-e29b-41d4-a716-446655440003', 'pi_weekly_002', 500, 'succeeded', 'weekly', 1, '2025'),
('550e8400-e29b-41d4-a716-446655440004', 'pi_weekly_003', 500, 'succeeded', 'weekly', 1, '2025');

-- Insert sample scores
INSERT INTO scores (user_id, week, season, points, correct_picks, total_picks) VALUES
('550e8400-e29b-41d4-a716-446655440002', 1, '2025', 0, 0, 1),
('550e8400-e29b-41d4-a716-446655440003', 1, '2025', 0, 0, 1),
('550e8400-e29b-41d4-a716-446655440004', 1, '2025', 0, 0, 0);
