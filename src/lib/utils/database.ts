import { createClient } from '@/lib/supabase/server'
import type { Game, Pick } from '@/lib/types/database'

export async function getGamesByWeek(season: string, week: number): Promise<Game[]> {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('games')
		.select('*')
		.eq('season', season)
		.eq('week', week)
		.order('start_time', { ascending: true })
	
	if (error) {
		console.error('Error fetching games:', error)
		throw new Error('Failed to fetch games')
	}
	
	return data || []
}

export async function getUserPicks(userId: string, week: number, season: string): Promise<Pick[]> {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('picks')
		.select(`
			*,
			games!inner(week, season)
		`)
		.eq('user_id', userId)
		.eq('games.week', week)
		.eq('games.season', season)
	
	if (error) {
		console.error('Error fetching user picks:', error)
		throw new Error('Failed to fetch user picks')
	}
	
	return data || []
}

export async function getWeekStandings(week: number, season: string) {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('scores')
		.select(`
			*,
			users!inner(display_name)
		`)
		.eq('week', week)
		.eq('season', season)
		.order('points', { ascending: false })
		.order('users.display_name', { ascending: true })
	
	if (error) {
		console.error('Error fetching week standings:', error)
		throw new Error('Failed to fetch week standings')
	}
	
	// Add rank to each standing
	const standings = (data || []).map((standing, index) => ({
		...standing,
		rank: index + 1
	}))
	
	return standings
}

export async function getSeasonStandings(season: string) {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('scores')
		.select(`
			*,
			users!inner(display_name)
		`)
		.eq('season', season)
	
	if (error) {
		console.error('Error fetching season standings:', error)
		throw new Error('Failed to fetch season standings')
	}
	
	// Aggregate scores by user
	const userTotals = new Map<string, { 
		total: number
		weeks: number
		totalPicks: number
		correctPicks: number
		user: { display_name: string }
	}>()
	
	data?.forEach(score => {
		const userId = score.user_id
		if (!userTotals.has(userId)) {
			userTotals.set(userId, { 
				total: 0, 
				weeks: 0, 
				totalPicks: 0,
				correctPicks: 0,
				user: score.users 
			})
		}
		const userTotal = userTotals.get(userId)!
		userTotal.total += score.points
		userTotal.weeks += 1
		userTotal.totalPicks += score.total_picks || 0
		userTotal.correctPicks += score.correct_picks || 0
	})
	
	// Convert to array and sort by total points
	const standings = Array.from(userTotals.entries())
		.map(([userId, { total, weeks, totalPicks, correctPicks, user }]) => {
			const correctPicksPercentage = totalPicks > 0 
				? Math.round((correctPicks / totalPicks) * 10000) / 100 // Round to 2 decimal places
				: 0
			return {
				user_id: userId,
				display_name: user.display_name,
				total_points: total,
				weeks_played: weeks,
				average_points: Math.round((total / weeks) * 100) / 100,
				total_picks: totalPicks,
				correct_picks: correctPicks,
				correct_picks_percentage: correctPicksPercentage
			}
		})
		.sort((a, b) => b.total_points - a.total_points)
		.map((standing, index) => ({
			...standing,
			rank: index + 1
		}))
	
	return standings
}

export async function getAppConfig(key: string): Promise<string | null> {
	const supabase = await createClient()
	
	const { data, error } = await supabase
		.from('app_config')
		.select('value')
		.eq('key', key)
		.single()
	
	if (error) {
		console.error('Error fetching app config:', error)
		return null
	}
	
	return data?.value || null
}

export async function getUserPaymentStatus(userId: string, week: number, season: string): Promise<boolean> {
	const supabase = await createClient()
	
	// Check for weekly payment
	const { data: weeklyPayment } = await supabase
		.from('payments')
		.select('id')
		.eq('user_id', userId)
		.eq('week', week)
		.eq('season', season)
		.eq('status', 'succeeded')
		.eq('payment_type', 'weekly')
		.single()
	
	if (weeklyPayment) return true
	
	// Check for season payment
	const { data: seasonPayment } = await supabase
		.from('payments')
		.select('id')
		.eq('user_id', userId)
		.eq('season', season)
		.eq('status', 'succeeded')
		.eq('payment_type', 'season')
		.single()
	
	if (seasonPayment) return true
	
	return false
}

/**
 * Check if a game is locked (cannot have picks created or modified)
 * Games are locked if:
 * 1. Status is "live" or "final" (game has started or finished)
 * 2. Current time is within 5 minutes (configurable) of game start time
 */
export async function isGameLocked(gameId: string): Promise<boolean> {
	const supabase = await createClient()
	
	// Get game data
	const { data: game, error } = await supabase
		.from('games')
		.select('start_time, status')
		.eq('id', gameId)
		.single()
	
	if (error || !game) return true
	
	// 1. Check if game status is "live" or "final" - these are always locked
	if (game.status === "live" || game.status === "final") {
		return true
	}
	
	// 2. Check if we're within the lock window (5 minutes before start time)
	const lockOffsetMinutes = await getAppConfig('game_lock_offset_minutes')
	const lockOffset = parseInt(lockOffsetMinutes || '5')
	
	const gameTime = new Date(game.start_time)
	const lockTime = new Date(gameTime.getTime() - (lockOffset * 60 * 1000))
	
	return new Date() >= lockTime
}

/**
 * Check if a game is locked (client-side version that takes game object)
 * Games are locked if:
 * 1. Status is "live" or "final" (game has started or finished)
 * 2. Current time is within 5 minutes (configurable) of game start time
 */
export function isGameLockedClient(game: { start_time: string; status: string }, lockOffsetMinutes: number = 5): boolean {
	// 1. Check if game status is "live" or "final" - these are always locked
	if (game.status === "live" || game.status === "final") {
		return true
	}
	
	// 2. Check if we're within the lock window (5 minutes before start time)
	const gameTime = new Date(game.start_time)
	const lockTime = new Date(gameTime.getTime() - (lockOffsetMinutes * 60 * 1000))
	
	return new Date() >= lockTime
}
