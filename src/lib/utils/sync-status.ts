// Sync status utilities for intelligent game data caching

import { createClient } from "@/lib/supabase/server"
import { getAppConfig } from "./database"

/**
 * Get the last sync timestamp for a specific season and week
 */
export async function getLastSyncTime(
	season: string,
	week: number
): Promise<Date | null> {
	const key = `last_games_sync_${season}_${week}`
	const timestampStr = await getAppConfig(key)

	if (!timestampStr) {
		return null
	}

	try {
		return new Date(timestampStr)
	} catch (error) {
		console.error(`Error parsing sync timestamp for ${key}:`, error)
		return null
	}
}

/**
 * Set the last sync timestamp for a specific season and week
 */
export async function setLastSyncTime(season: string, week: number): Promise<void> {
	const supabase = await createClient()
	const key = `last_games_sync_${season}_${week}`
	const timestamp = new Date().toISOString()

	const { error } = await supabase.from("app_config").upsert(
		{
			key,
			value: timestamp,
			description: `Last sync time for season ${season}, week ${week}`,
		},
		{ onConflict: "key" }
	)

	if (error) {
		console.error(`Error setting sync timestamp for ${key}:`, error)
	}
}

/**
 * Check if any games have been updated since the last sync
 */
export async function hasGamesChangedSince(
	season: string,
	week: number,
	lastSyncTime: Date
): Promise<boolean> {
	const supabase = await createClient()

	const { data, error } = await supabase
		.from("games")
		.select("id")
		.eq("season", season)
		.eq("week", week)
		.gt("updated_at", lastSyncTime.toISOString())
		.limit(1)

	if (error) {
		console.error("Error checking for game changes:", error)
		// On error, assume games have changed to be safe
		return true
	}

	return (data?.length || 0) > 0
}

/**
 * Check if we're in an active game window (games starting soon or in progress)
 * Active window: games with status 'scheduled' or 'live' starting within 2 hours
 */
export async function isActiveGameWindow(
	season: string,
	week: number
): Promise<boolean> {
	const supabase = await createClient()
	const now = new Date()
	const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
	const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

	const { data, error } = await supabase
		.from("games")
		.select("id, start_time, status")
		.eq("season", season)
		.eq("week", week)
		.in("status", ["scheduled", "live"])
		.gte("start_time", twoHoursAgo.toISOString())
		.lte("start_time", twoHoursFromNow.toISOString())
		.limit(1)

	if (error) {
		console.error("Error checking active game window:", error)
		return false
	}

	return (data?.length || 0) > 0
}

/**
 * Determine if games should be synced based on caching logic
 * 
 * Sync decision tree:
 * 1. No sync timestamp exists → Sync (first time)
 * 2. Games have changed (status or scores updated) → Sync
 * 3. Active game window (games starting within 2 hours or in progress) → Sync if >5 min since last sync
 * 4. Default → Sync if >15 min since last sync
 */
export async function shouldSyncGames(
	season: string,
	week: number
): Promise<boolean> {
	const lastSyncTime = await getLastSyncTime(season, week)

	// 1. No sync timestamp exists → Sync (first time)
	if (!lastSyncTime) {
		return true
	}

	const now = new Date()
	const timeSinceSync = now.getTime() - lastSyncTime.getTime()

	// 2. Check if games have changed since last sync
	const gamesChanged = await hasGamesChangedSince(season, week, lastSyncTime)
	if (gamesChanged) {
		return true
	}

	// 3. Check if we're in an active game window
	const activeWindow = await isActiveGameWindow(season, week)
	if (activeWindow) {
		// During active windows, sync more frequently (every 5 minutes)
		const ACTIVE_WINDOW_SYNC_INTERVAL = 5 * 60 * 1000 // 5 minutes
		return timeSinceSync > ACTIVE_WINDOW_SYNC_INTERVAL
	}

	// 4. Default: sync every 15 minutes
	const DEFAULT_SYNC_INTERVAL = 15 * 60 * 1000 // 15 minutes
	return timeSinceSync > DEFAULT_SYNC_INTERVAL
}

