"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useParams } from "next/navigation"
import { Game, Team, Pick } from "@/lib/types/database"

interface GameWithTeams extends Game {
	home_team_data: Team | null
	away_team_data: Team | null
}

interface UserPick {
	gameId: string
	pickedTeam: string
	confidencePoints: number
	saving?: boolean
	saved?: boolean
	justCleared?: boolean // Flag to indicate this pick was just cleared (confidence points moved to another game)
	clearedPoint?: number // The confidence point value that was cleared (to show in red)
}

function PicksPageContent() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const params = useParams()
	const [games, setGames] = useState<GameWithTeams[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [userPicks, setUserPicks] = useState<UserPick[]>([])
	const [season] = useState("2025") // Fixed season, no selector
	const [week, setWeek] = useState<number | null>(null) // Start as null until we know current week
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [message, setMessage] = useState<{
		text: string
		type: "success" | "error" | "info"
	} | null>(null)
	const [currentWeek, setCurrentWeek] = useState<number | null>(null)
	const [weekInitialized, setWeekInitialized] = useState(false) // Track if week has been initialized
	const [debugInfo, setDebugInfo] = useState<any>(null)
	const [checkingOnboarding, setCheckingOnboarding] = useState(true)

	// Cache for games and picks by week (similar to group-picks)
	const [gamesCache, setGamesCache] = useState<Map<number, GameWithTeams[]>>(
		new Map()
	)
	const [picksCache, setPicksCache] = useState<Map<number, UserPick[]>>(
		new Map()
	)
	const [teamsLoaded, setTeamsLoaded] = useState(false) // Track if teams have been loaded

	// Available confidence points (1-16)
	const confidencePoints = Array.from({ length: 16 }, (_, i) => i + 1)

	// Check if user has completed onboarding
	useEffect(() => {
		if (!authLoading && !user) {
			router.push("/signin")
			return
		}
		if (user && !authLoading) {
			const checkOnboarding = async () => {
				try {
					const response = await fetch("/api/users/me")
					const data = await response.json()
					if (data.success && data.data) {
						if (!data.data.username) {
							router.push("/onboarding")
							return
						}
					} else {
						router.push("/onboarding")
						return
					}
				} catch (error) {
					console.error("Error checking onboarding:", error)
				} finally {
					setCheckingOnboarding(false)
				}
			}
			checkOnboarding()
		}
	}, [user, authLoading, router])

	// Initialize week from route param
	useEffect(() => {
		const initializeWeek = async () => {
			try {
				// Always fetch current week first
				const response = await fetch("/api/season")
				const data = await response.json()
				if (data.success && data.data.currentWeek) {
					const apiCurrentWeek = data.data.currentWeek
					setCurrentWeek(apiCurrentWeek)

					// Now check route param
					const weekParam = params?.week as string

					if (weekParam === "current") {
						// "current" means use the current week, but keep URL as /picks/current
						setWeek(apiCurrentWeek)
					} else if (weekParam) {
						const weekNum = parseInt(weekParam, 10)
						// Validate: must be valid number, between 1-18, and not in the future
						if (
							!isNaN(weekNum) &&
							weekNum >= 1 &&
							weekNum <= 18 &&
							weekNum <= apiCurrentWeek
						) {
							setWeek(weekNum)
							// URL is valid, keep it
						} else {
							// URL param is invalid or in the future, redirect to current
							router.replace(`/picks/current`, { scroll: false })
						}
					} else {
						// No week param, redirect to current
						router.replace(`/picks/current`, { scroll: false })
					}
				} else {
					// Fallback if API fails
					const weekParam = params?.week as string
					if (weekParam === "current") {
						// Can't determine current week, redirect to week 1
						router.replace(`/picks/1`, { scroll: false })
					} else if (weekParam) {
						const weekNum = parseInt(weekParam, 10)
						if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
							setWeek(weekNum)
						} else {
							router.replace(`/picks/1`, { scroll: false })
						}
					} else {
						router.replace(`/picks/1`, { scroll: false })
					}
				}
			} catch (error) {
				console.error("Error fetching current week:", error)
				// Fallback on error
				const weekParam = params?.week as string
				if (weekParam === "current") {
					router.replace(`/picks/1`, { scroll: false })
				} else if (weekParam) {
					const weekNum = parseInt(weekParam, 10)
					if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
						setWeek(weekNum)
					} else {
						router.replace(`/picks/1`, { scroll: false })
					}
				} else {
					router.replace(`/picks/1`, { scroll: false })
				}
			} finally {
				setWeekInitialized(true)
			}
		}

		initializeWeek()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.week]) // Run when week param changes

	// Update week when URL changes (but only if week is already initialized)
	useEffect(() => {
		if (!weekInitialized) return // Don't process URL changes until week is initialized

		const weekParam = params?.week as string
		if (weekParam === "current") {
			// "current" means use the current week
			if (currentWeek !== null) {
				setWeek(currentWeek)
			}
		} else if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			// Validate against current week if we have it
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				if (currentWeek === null || weekNum <= currentWeek) {
					setWeek(weekNum)
				} else {
					// Week is in the future, redirect to current
					router.replace(`/picks/current`, { scroll: false })
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [params?.week, weekInitialized, currentWeek])

	// Update URL when week changes via dropdown (not from URL)
	const handleWeekChange = (newWeek: number) => {
		setWeek(newWeek)
		router.push(`/picks/${newWeek}`, { scroll: false })
	}

	// Load teams once (they don't change)
	useEffect(() => {
		if (!teamsLoaded) {
			fetchTeams()
			setTeamsLoaded(true)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		// Don't fetch games until week is initialized and we have a valid week
		if (user && weekInitialized && week !== null) {
			// Check cache first
			const cachedGames = gamesCache.get(week)
			const cachedPicks = picksCache.get(week)

			// Check if week is completed (all games final with scores)
			const isWeekCompleted =
				cachedGames?.every(
					(g) =>
						g.status === "final" &&
						g.home_score !== null &&
						g.away_score !== null
				) ?? false

			const isCurrentWeek = currentWeek !== null && week === currentWeek

			if (cachedGames && cachedPicks) {
				// For completed weeks, show cached data immediately (no refresh needed)
				if (isWeekCompleted) {
					setGames(cachedGames)
					setUserPicks(cachedPicks)
					setLoading(false)
					return // Don't fetch - completed weeks don't change
				}

				// For current week, show cached data immediately but fetch fresh in background
				if (isCurrentWeek) {
					setGames(cachedGames)
					setUserPicks(cachedPicks)
					setLoading(false)
					// Fetch fresh data in background
					fetchGamesInBackground()
					fetchUserPicksInBackground()
					return
				}
			}

			// No cache or incomplete cache - fetch fresh
			// Combine fetches to reduce waterfall
			setGames([])
			setUserPicks([])
			setLoading(true)
			Promise.all([fetchGames(), fetchUserPicks()]).finally(() => {
				setLoading(false)
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, season, week, weekInitialized, currentWeek])

	// Filter games to only show current week to prevent race condition
	const filteredGames =
		week !== null
			? games.filter((game) => {
					return (
						Number(game.week) === Number(week) &&
						String(game.season) === String(season)
					)
			  })
			: []

	const fetchGamesInBackground = async () => {
		if (week === null) return

		try {
			const isCurrentWeek = currentWeek !== null && week === currentWeek
			// For current week, use cache-busting. For past weeks, use cache
			const url = isCurrentWeek
				? `/api/games?season=${season}&week=${week}&_t=${Date.now()}`
				: `/api/games?season=${season}&week=${week}`

			const fetchOptions: RequestInit = isCurrentWeek
				? { cache: "no-store" }
				: { cache: "default" }

			const response = await fetch(url, fetchOptions)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			const data = await response.json()
			if (data.success && Array.isArray(data.data)) {
				const validGames = data.data
					.filter((game: GameWithTeams) => {
						return (
							game.id &&
							game.id !== null &&
							game.id !== undefined &&
							game.id !== ""
						)
					})
					.map((game: GameWithTeams) => {
						return { ...game, id: String(game.id) }
					})

				setGames(validGames)
				// Update cache
				setGamesCache((prev) => {
					const newCache = new Map(prev)
					newCache.set(week, validGames)
					return newCache
				})
			}
		} catch (error) {
			console.error("Error fetching games in background:", error)
		}
	}

	const fetchGames = async () => {
		if (week === null) return

		try {
			setLoading(true)
			const isCurrentWeek = currentWeek !== null && week === currentWeek
			// For current week, use cache-busting. For past weeks, use cache
			const url = isCurrentWeek
				? `/api/games?season=${season}&week=${week}&_t=${Date.now()}`
				: `/api/games?season=${season}&week=${week}`

			const fetchOptions: RequestInit = isCurrentWeek
				? { cache: "no-store" }
				: { cache: "default" }

			const response = await fetch(url, fetchOptions)
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			const data = await response.json()
			if (data.success && Array.isArray(data.data)) {
				// Games from the database should have UUIDs
				// Filter out any games without an id (shouldn't happen, but be safe)
				const validGames = data.data
					.filter((game: GameWithTeams) => {
						// Games must have an id (UUID from database)
						return (
							game.id &&
							game.id !== null &&
							game.id !== undefined &&
							game.id !== ""
						)
					})
					.map((game: GameWithTeams) => {
						// Ensure id is a string for consistent comparison
						return { ...game, id: String(game.id) }
					})

				setGames(validGames)
				// Update cache
				setGamesCache((prev) => {
					const newCache = new Map(prev)
					newCache.set(week, validGames)
					return newCache
				})
			} else {
				console.warn("Games API returned unsuccessful response:", data)
				setGames([])
			}
		} catch (error) {
			console.error("Error fetching games:", error)
			setGames([])
		} finally {
			setLoading(false)
		}
	}

	const fetchTeams = async () => {
		try {
			const response = await fetch("/api/teams")
			const data = await response.json()
			if (data.success) {
				setTeams(data.data)
			}
		} catch (error) {
			console.error("Error fetching teams:", error)
		}
	}

	const fetchUserPicksInBackground = async () => {
		if (week === null) return

		try {
			const isCurrentWeek = currentWeek !== null && week === currentWeek
			const url = isCurrentWeek
				? `/api/picks?season=${season}&week=${week}&_t=${Date.now()}`
				: `/api/picks?season=${season}&week=${week}`

			const fetchOptions: RequestInit = isCurrentWeek
				? { cache: "no-store", credentials: "include" }
				: { cache: "default", credentials: "include" }

			const response = await fetch(url, fetchOptions)
			const data = await response.json()
			if (data.success) {
				const picks: UserPick[] = data.data.map((pick: Pick) => ({
					gameId: String(pick.game_id),
					pickedTeam: pick.picked_team,
					confidencePoints: pick.confidence_points,
					saving: false,
					saved: true,
					justCleared: false,
					clearedPoint: undefined,
				}))

				const currentWeekGameIds = new Set(
					games.map((g) => String(g.id).trim())
				)

				const filteredPicks = picks.filter((pick) =>
					currentWeekGameIds.has(String(pick.gameId).trim())
				)

				setUserPicks(filteredPicks)
				// Update cache
				setPicksCache((prev) => {
					const newCache = new Map(prev)
					newCache.set(week, filteredPicks)
					return newCache
				})
			}
		} catch (error) {
			console.error("Error fetching user picks in background:", error)
		}
	}

	const fetchUserPicks = async () => {
		if (week === null) return

		try {
			const isCurrentWeek = currentWeek !== null && week === currentWeek
			const url = isCurrentWeek
				? `/api/picks?season=${season}&week=${week}&_t=${Date.now()}`
				: `/api/picks?season=${season}&week=${week}`

			const fetchOptions: RequestInit = isCurrentWeek
				? { cache: "no-store", credentials: "include" }
				: { cache: "default", credentials: "include" }

			const response = await fetch(url, fetchOptions)
			const data = await response.json()
			if (data.success) {
				// Convert picks to UserPick format
				// Ensure gameId is always a string for consistent comparison
				const picks: UserPick[] = data.data.map((pick: Pick) => ({
					gameId: String(pick.game_id),
					pickedTeam: pick.picked_team,
					confidencePoints: pick.confidence_points,
					saving: false,
					saved: true, // Picks from database are saved
					justCleared: false, // Reset cleared flag when loading from database
					clearedPoint: undefined, // Reset cleared point when loading from database
				}))

				// Get current week's game IDs to filter picks
				const currentWeekGameIds = new Set(
					games.map((g) => String(g.id).trim())
				)

				// Only keep picks for current week's games (API should already filter, but be safe)
				const filteredPicks = picks.filter((pick) =>
					currentWeekGameIds.has(String(pick.gameId).trim())
				)

				// Replace picks entirely - API already filters by week, so we don't need to merge
				// This ensures we don't show picks from other weeks
				setUserPicks(filteredPicks)
				// Update cache
				setPicksCache((prev) => {
					const newCache = new Map(prev)
					newCache.set(week, filteredPicks)
					return newCache
				})
			}
		} catch (error) {
			console.error("Error fetching user picks:", error)
		}
	}

	const savePick = async (pick: UserPick) => {
		if (!user || !pick.pickedTeam) {
			console.warn("[savePick] Skipping save - no user or team:", {
				hasUser: !!user,
				hasTeam: !!pick.pickedTeam,
			})
			return // Don't save incomplete picks (team is required)
		}

		console.log("[savePick] Attempting to save pick:", {
			gameId: pick.gameId,
			team: pick.pickedTeam,
			points: pick.confidencePoints,
		})

		// Set saving state
		setUserPicks((prev) =>
			prev.map((p) =>
				String(p.gameId).trim() === String(pick.gameId).trim()
					? { ...p, saving: true, saved: false }
					: p
			)
		)

		try {
			// First, test auth
			const authTest = await fetch("/api/auth-test", { credentials: "include" })
			const authData = await authTest.json()
			console.log("[savePick] Auth test result:", authData)

			if (!authData.auth?.hasUser) {
				console.error("[savePick] Auth test failed - no user found")
				console.error("[savePick] Auth error:", authData.auth?.error)
				console.error("[savePick] Session:", authData.session)
				console.error("[savePick] Database check:", authData.database)
				setDebugInfo(authData)

				// Provide more specific error message
				let errorMsg = "Authentication failed. "
				if (authData.auth?.error?.includes("does not exist")) {
					errorMsg +=
						"Your session may be invalid. Please sign out and sign in again."
				} else if (authData.session?.error) {
					errorMsg += "Session error: " + authData.session.error
				} else {
					errorMsg += "Please refresh the page and try again."
				}

				setMessage({ text: errorMsg, type: "error" })
				// Clear saving state on error
				setUserPicks((prev) =>
					prev.map((p) =>
						String(p.gameId).trim() === String(pick.gameId).trim()
							? { ...p, saving: false, saved: false }
							: p
					)
				)
				return
			}

			// Check if user exists in database (warn but don't block - user might not have a users table row yet)
			if (authData.database && !authData.database.exists) {
				console.warn(
					"[savePick] User not found in users table (but authenticated):",
					authData.database
				)
				// Don't block saving - the user is authenticated, which is what matters for picks
				// The users table row might be created later or might not be required
			}

			// Try POST first (for new picks), then PUT if it fails because pick exists
			const response = await fetch("/api/picks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					gameId: pick.gameId,
					pickedTeam: pick.pickedTeam,
					confidencePoints: pick.confidencePoints || 0,
				}),
			})

			const data = await response.json()
			console.log("[savePick] POST response:", {
				success: data.success,
				message: data.message,
				status: response.status,
			})

			if (!data.success) {
				// If POST fails because pick exists, try PUT
				if (data.message?.includes("already has a pick")) {
					console.log("[savePick] Pick exists, trying PUT...")
					const putResponse = await fetch("/api/picks", {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: "include",
						body: JSON.stringify({
							gameId: pick.gameId,
							pickedTeam: pick.pickedTeam,
							confidencePoints: pick.confidencePoints || 0,
						}),
					})
					const putData = await putResponse.json()
					console.log("[savePick] PUT response:", {
						success: putData.success,
						message: putData.message,
						status: putResponse.status,
					})
					if (!putData.success) {
						console.error("[savePick] Failed to update pick:", putData.message)
						setMessage({
							text: `Failed to save pick: ${putData.message}`,
							type: "error",
						})
						// Clear saving state on error
						setUserPicks((prev) =>
							prev.map((p) =>
								String(p.gameId).trim() === String(pick.gameId).trim()
									? { ...p, saving: false, saved: false }
									: p
							)
						)
					} else {
						console.log("[savePick] Pick updated successfully")
						// Set saved state (no message - checkmark will show)
						setUserPicks((prev) => {
							const updated = prev.map((p) =>
								String(p.gameId).trim() === String(pick.gameId).trim()
									? { ...p, saving: false, saved: true }
									: p
							)
							// Update cache
							if (week !== null) {
								setPicksCache((prevCache) => {
									const newCache = new Map(prevCache)
									newCache.set(week, updated)
									return newCache
								})
							}
							return updated
						})
					}
				} else {
					console.error("[savePick] Failed to save pick:", data.message)
					setMessage({
						text: `Failed to save pick: ${data.message}`,
						type: "error",
					})
					// Clear saving state on error
					setUserPicks((prev) =>
						prev.map((p) =>
							String(p.gameId).trim() === String(pick.gameId).trim()
								? { ...p, saving: false, saved: false }
								: p
						)
					)
				}
			} else {
				console.log("[savePick] Pick saved successfully")
				// Set saved state (no message - checkmark will show)
				setUserPicks((prev) => {
					const updated = prev.map((p) =>
						String(p.gameId).trim() === String(pick.gameId).trim()
							? { ...p, saving: false, saved: true }
							: p
					)
					// Update cache
					if (week !== null) {
						setPicksCache((prevCache) => {
							const newCache = new Map(prevCache)
							newCache.set(week, updated)
							return newCache
						})
					}
					return updated
				})
			}
		} catch (error) {
			console.error("[savePick] Error saving pick:", error)
			setMessage({
				text: `Error saving pick: ${
					error instanceof Error ? error.message : String(error)
				}`,
				type: "error",
			})
			// Clear saving state on error
			setUserPicks((prev) =>
				prev.map((p) =>
					String(p.gameId).trim() === String(pick.gameId).trim()
						? { ...p, saving: false, saved: false }
						: p
				)
			)
		}
	}

	const handlePickChange = (gameId: string, pickedTeam: string) => {
		if (!gameId || gameId === "undefined" || gameId === "null") {
			console.error("Invalid gameId:", gameId)
			return
		}

		setUserPicks((prev) => {
			// Normalize the gameId for comparison
			const normalizedGameId = String(gameId).trim()

			// Create a new array to avoid mutation issues
			// Use strict comparison with normalized IDs
			const existingIndex = prev.findIndex((p) => {
				const pickGameId = String(p.gameId).trim()
				return (
					pickGameId === normalizedGameId &&
					pickGameId !== "" &&
					normalizedGameId !== ""
				)
			})

			let updated: UserPick[]
			if (existingIndex >= 0) {
				// Update existing pick for this game ONLY - create completely new object
				updated = prev.map((pick, index) => {
					if (index === existingIndex) {
						return {
							...pick,
							pickedTeam, // Only update the pickedTeam for this specific game
							saved: false, // Reset saved state when pick changes
						}
					}
					return pick // Return unchanged pick for all other games
				})
			} else {
				// Add new pick for this game
				updated = [
					...prev,
					{
						gameId: normalizedGameId,
						pickedTeam,
						confidencePoints: 0,
						saving: false,
						saved: false,
					},
				]
			}

			// Auto-save if pick has a team selected (even if confidence points not set yet)
			const updatedPick = updated.find(
				(p) => String(p.gameId).trim() === normalizedGameId
			)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}

			return updated
		})
	}

	const handleConfidenceChange = async (
		gameId: string,
		confidencePoints: number
	) => {
		if (!gameId || gameId === "undefined" || gameId === "null") {
			console.error("Invalid gameId:", gameId)
			return
		}

		// Normalize the gameId for comparison
		const normalizedGameId = String(gameId).trim()

		// Find if this confidence point is already used by another game
		const pointUsedBy = userPicks.find(
			(p) =>
				p.confidencePoints === confidencePoints &&
				String(p.gameId).trim() !== normalizedGameId
		)

		// If this point is used by another game, clear it first (before updating the new pick)
		if (pointUsedBy && pointUsedBy.pickedTeam) {
			const clearedPick: UserPick = {
				...pointUsedBy,
				confidencePoints: 0,
				saved: false,
				justCleared: true, // Mark as just cleared to show red highlight
				clearedPoint: pointUsedBy.confidencePoints, // Store the cleared point value to highlight it
			}

			// Update state immediately for UI responsiveness
			setUserPicks((prev) =>
				prev.map((p) =>
					String(p.gameId).trim() === String(pointUsedBy.gameId).trim()
						? clearedPick
						: p
				)
			)

			// Save the cleared pick FIRST (await to ensure it completes)
			await savePick(clearedPick)
		}

		// Now update the state for the new pick
		setUserPicks((prev) => {
			const existingIndex = prev.findIndex((p) => {
				const pickGameId = String(p.gameId).trim()
				return (
					pickGameId === normalizedGameId &&
					pickGameId !== "" &&
					normalizedGameId !== ""
				)
			})

			let updated: UserPick[]
			if (existingIndex >= 0) {
				// Update existing pick for this game
				updated = prev.map((pick, index) => {
					if (index === existingIndex) {
						return {
							...pick,
							confidencePoints,
							saved: false,
							justCleared: false, // Remove red highlight when new confidence point is selected
							clearedPoint: undefined, // Clear the cleared point value
						}
					}
					return pick
				})
			} else {
				// Add new pick for this game (but keep existing pickedTeam if any)
				const existingPick = prev.find(
					(p) => String(p.gameId).trim() === normalizedGameId
				)
				updated = [
					...prev,
					{
						gameId: normalizedGameId,
						saving: false,
						saved: false,
						pickedTeam: existingPick?.pickedTeam || "",
						confidencePoints,
					},
				]
			}

			// Auto-save when confidence points are set (if team is already selected)
			const updatedPick = updated.find(
				(p) => String(p.gameId).trim() === normalizedGameId
			)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}

			return updated
		})
	}

	const getUsedConfidencePoints = () => {
		// Only count confidence points used for games in the current week
		const currentWeekGameIds = new Set(
			filteredGames.map((g) => String(g.id).trim())
		)
		return userPicks
			.filter((pick) => {
				// Only include picks for games in the current week
				const pickGameId = String(pick.gameId).trim()
				return currentWeekGameIds.has(pickGameId) && pick.confidencePoints > 0
			})
			.map((pick) => pick.confidencePoints)
	}

	const getAvailableConfidencePoints = () => {
		const used = getUsedConfidencePoints()
		return confidencePoints.filter((point) => !used.includes(point))
	}

	const isGameLocked = (game: Game) => {
		// Games are locked if:
		// 1. Status is "live" or "final" (game has started or finished)
		// 2. Current time is within 5 minutes of game start time
		if (game.status === "live" || game.status === "final") {
			return true
		}

		const gameTime = new Date(game.start_time)
		const now = new Date()
		// Games are locked 5 minutes before start time
		const lockTime = new Date(gameTime.getTime() - 5 * 60 * 1000)
		return now >= lockTime
	}

	const submitPicks = async () => {
		if (!user) return

		// Validate picks
		const validPicks = userPicks.filter(
			(pick) => pick.pickedTeam && pick.confidencePoints > 0
		)

		if (validPicks.length === 0) {
			setMessage({ text: "Please make at least one pick", type: "error" })
			return
		}

		// Check for duplicate confidence points
		const usedPoints = getUsedConfidencePoints()
		if (new Set(usedPoints).size !== usedPoints.length) {
			setMessage({
				text: "Each confidence point can only be used once per week",
				type: "error",
			})
			return
		}

		setSubmitting(true)
		setMessage(null)

		try {
			// Since picks are auto-saved, just refresh to show confirmation
			// Don't clear the state - just refresh picks from database to ensure sync
			const currentPicks = [...userPicks] // Save current state
			await fetchUserPicks()

			// Merge any new picks from database with current state
			// This ensures we don't lose any unsaved changes
			setUserPicks((prev) => {
				const merged = new Map<string, UserPick>()

				// First, add all picks from database (these are saved)
				prev.forEach((pick) => {
					merged.set(String(pick.gameId), pick)
				})

				// Then, add any current picks that aren't in database yet
				currentPicks.forEach((pick) => {
					if (pick.pickedTeam && pick.confidencePoints > 0) {
						merged.set(String(pick.gameId), pick)
					}
				})

				return Array.from(merged.values())
			})

			setMessage({ text: "All picks saved successfully!", type: "success" })
			setTimeout(() => setMessage(null), 3000)
		} catch (error) {
			setMessage({
				text: error instanceof Error ? error.message : "Failed to verify picks",
				type: "error",
			})
		} finally {
			setSubmitting(false)
		}
	}

	if (authLoading || checkingOnboarding) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4580BC] mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading...</p>
					</div>
				</div>
			</div>
		)
	}

	if (!user) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">
							Make Your Picks
						</h1>
						<p className="text-gray-600">Please sign in to make your picks.</p>
					</div>
				</div>
			</div>
		)
	}

	if (loading || !weekInitialized || week === null) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4580BC] mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading games...</p>
					</div>
				</div>
			</div>
		)
	}

	// Build week options - show all 18 weeks
	const weekOptions = Array.from({ length: 18 }, (_, i) => i + 1)

	return (
		<div className="min-h-screen" style={{ backgroundColor: '#4580BC' }}>
			{/* Header with padding */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
				<div className="mb-4 md:mb-8">
					<h1 className="text-2xl md:text-3xl font-galindo text-white mb-2 md:mb-4">
						Make Your Picks
					</h1>
					<p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
						Pick the winner of each game and assign confidence points (1-16).
						Each confidence point can only be used once per week.
					</p>

					{/* Picks Status Indicator */}
					{(() => {
						// Count non-locked games (use filteredGames to avoid race condition)
						const nonLockedGames = filteredGames.filter((g) => !isGameLocked(g))
						// Count complete picks (has both winner and confidence points > 0)
						const completePicks = userPicks.filter((pick) => {
							const game = filteredGames.find(
								(g) => String(g.id).trim() === String(pick.gameId).trim()
							)
							return (
								game &&
								!isGameLocked(game) &&
								pick.pickedTeam &&
								pick.confidencePoints > 0
							)
						})
						const isComplete =
							nonLockedGames.length > 0 &&
							completePicks.length === nonLockedGames.length

						return (
							<div
								className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
									isComplete
										? "bg-[#10B981] text-white border-2 border-[#10B981] shadow-md"
										: "bg-[#E9932D] text-white border-2 border-[#E9932D] shadow-md"
								}`}
							>
								Picks: {isComplete ? "Complete" : "Incomplete"}
							</div>
						)
					})()}

					{/* Controls - Mobile optimized - Only Week selector */}
					<div className="flex flex-wrap gap-3 md:gap-4 items-center mb-4 md:mb-6">
						<div className="flex-1 min-w-[120px]">
							<label
								htmlFor="week"
								className="block text-xs md:text-sm font-medium text-gray-700 mb-1"
							>
								Week
							</label>
							<select
								id="week"
								value={week || ""}
								onChange={(e) => {
									const newWeek = parseInt(e.target.value, 10)
									if (newWeek === currentWeek) {
										router.push(`/picks/current`, { scroll: false })
									} else {
										handleWeekChange(newWeek)
									}
								}}
								className="w-full bg-white border-2 border-gray-300 rounded-md px-3 py-2 text-sm md:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4580BC] focus:border-[#4580BC] transition-colors"
							>
								{weekOptions.map((w) => (
									<option key={w} value={w}>
										Week {w}
										{w === currentWeek ? " (Current)" : ""}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Message */}
					{message && (
						<div
							className={`p-4 rounded-md mb-6 border-2 ${
								message.type === "success"
									? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]"
									: message.type === "error"
									? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]"
									: "bg-[#4580BC]/10 text-[#4580BC] border-[#4580BC]"
							}`}
						>
							{message.text}
						</div>
					)}

					{/* Debug Panel - Only show if there's debug info */}
					{debugInfo && (
						<div className="mb-6 p-4 bg-[#E9932D]/10 border-2 border-[#E9932D] rounded-md">
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-bold text-[#E9932D] text-lg">
									🔍 Debug Info
								</h3>
								<button
									onClick={() => setDebugInfo(null)}
									className="text-sm text-[#E9932D] hover:text-[#E9932D] underline font-semibold"
								>
									✕ Clear
								</button>
							</div>
							<div className="bg-white p-4 rounded border-2 border-[#E9932D]/50">
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">
										Authentication Status:
									</h4>
									<div
										className={`p-3 rounded ${
											debugInfo.auth?.hasUser
												? "bg-green-100 text-green-900"
												: "bg-red-100 text-red-900"
										}`}
									>
										<strong>User Found:</strong>{" "}
										{debugInfo.auth?.hasUser ? "✅ Yes" : "❌ No"}
										<br />
										{debugInfo.auth?.userId && (
											<>
												<strong>User ID:</strong> {debugInfo.auth.userId}
												<br />
											</>
										)}
										{debugInfo.auth?.error && (
											<>
												<strong>Error:</strong> {debugInfo.auth.error}
											</>
										)}
									</div>
								</div>
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">
										Cookies Found ({debugInfo.cookies?.length || 0}):
									</h4>
									<div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
										{debugInfo.cookies?.map((cookie: any, idx: number) => (
											<div
												key={idx}
												className="mb-2 pb-2 border-b border-gray-200 last:border-0"
											>
												<strong className="text-gray-800">{cookie.name}</strong>
												<br />
												<span className="text-sm text-gray-600">
													Has Value: {cookie.hasValue ? "✅" : "❌"} | Length:{" "}
													{cookie.valueLength || 0}
												</span>
											</div>
										))}
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 mb-2">
										Full JSON:
									</h4>
									<pre className="text-xs overflow-auto max-h-64 bg-gray-50 p-3 rounded border font-mono text-gray-900 font-medium">
										{JSON.stringify(debugInfo, null, 2)}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Games - No padding/margin between items */}
			<div>
				{filteredGames.length === 0 ? (
					<div className="text-center py-8 md:py-12 px-4 sm:px-6 lg:px-8">
						<p className="text-gray-500 text-sm md:text-base">
							No games found for Week {week}
						</p>
					</div>
				) : (
					filteredGames.map((game) => {
						// Find the pick for THIS specific game by matching gameId
						// Use strict comparison with normalized IDs
						const gameIdStr = String(game.id).trim()
						const userPick = userPicks.find((p) => {
							const pickGameIdStr = String(p.gameId).trim()
							return (
								pickGameIdStr === gameIdStr &&
								pickGameIdStr !== "" &&
								gameIdStr !== ""
							)
						})
						const isLocked = isGameLocked(game)
						const homeTeam = teams.find(
							(t) => t.abbreviation === game.home_team
						)
						const awayTeam = teams.find(
							(t) => t.abbreviation === game.away_team
						)

						// Determine if game is completed and who won
						const isCompleted = game.status === "final"
						const hasScores =
							game.home_score !== null &&
							game.home_score !== undefined &&
							game.away_score !== null &&
							game.away_score !== undefined
						const winningTeam =
							hasScores && isCompleted
								? game.home_score! > game.away_score!
									? game.home_team
									: game.away_team
								: null

						// Determine if user's pick was correct
						// Only mark as correct/incorrect if game is final (completed)
						// Locked or in-progress games should not show red/green - they should show blue
						// Explicitly check: if game is locked OR live (in-progress), pickCorrect should be null
						const isLockedOrInProgress = isLocked || game.status === "live"
						const pickCorrect =
							!isLockedOrInProgress && isCompleted && userPick?.pickedTeam && winningTeam
								? userPick.pickedTeam === winningTeam
								: null

						return (
							<div
								key={`game-${
									game.id || `index-${filteredGames.indexOf(game)}`
								}`}
								className="bg-white border-b border-gray-200 py-3 md:py-4 px-4 sm:px-6 lg:px-8 relative"
							>
								{/* Save Status Indicator - Upper Right */}
								<div className="absolute top-2 right-2 md:top-4 md:right-4">
									{isLocked ? (
										<div className="text-gray-500">
											<svg
												className="w-5 h-5 md:w-6 md:h-6"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
													clipRule="evenodd"
												/>
											</svg>
										</div>
									) : (
										<>
											{userPick?.saving && (
												<div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-[#4580BC]"></div>
											)}
											{!userPick?.saving &&
												(() => {
													// Check if pick is complete (has both winner and confidence points)
													const isComplete =
														userPick?.pickedTeam &&
														userPick?.confidencePoints > 0

													if (isComplete && userPick?.saved) {
														// Complete and saved - green checkmark
														return (
															<div className="text-[#10B981]">
																<svg
																	className="w-5 h-5 md:w-6 md:h-6"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
														)
													} else if (
														userPick &&
														(!userPick.pickedTeam ||
															userPick.confidencePoints === 0)
													) {
														// Incomplete - yellow warning icon (circle with horizontal bar/minus)
														return (
															<div className="text-[#E9932D]">
																<svg
																	className="w-5 h-5 md:w-6 md:h-6"
																	fill="currentColor"
																	viewBox="0 0 20 20"
																>
																	<path
																		fillRule="evenodd"
																		d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
																		clipRule="evenodd"
																	/>
																</svg>
															</div>
														)
													}
													return null
												})()}
										</>
									)}
								</div>

								{/* Game Header - Compact */}
								<div className="flex items-center justify-between mb-2">
									<div className="flex items-center space-x-2">
										<span className="text-xs text-gray-500">
											{new Date(game.start_time).toLocaleDateString([], {
												weekday: "short",
												month: "short",
												day: "numeric",
											})}{" "}
											{new Date(game.start_time).toLocaleTimeString([], {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
										{game.is_snf && (
											<span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">
												SNF
											</span>
										)}
										{game.is_mnf && (
											<span className="bg-orange-100 text-orange-800 text-xs px-1.5 py-0.5 rounded">
												MNF
											</span>
										)}
									</div>
								</div>

								{/* Teams - Compact List View */}
								{!isLocked ? (
									<div className="mb-2">
										<div className="flex items-center gap-2 md:gap-3">
											{/* Away Team Button */}
											<button
												type="button"
												onClick={() =>
													handlePickChange(game.id, game.away_team)
												}
												disabled={isCompleted}
												className={`flex items-center space-x-2 p-2 md:p-2.5 rounded border-2 transition-all flex-1 ${
													userPick?.pickedTeam === game.away_team
														? pickCorrect === true
															? "border-[#10B981] bg-[#10B981]/10"
															: pickCorrect === false
															? "border-[#EF4444] bg-[#EF4444]/10"
															: "border-[#4580BC] bg-[#4580BC]/10"
														: "border-gray-200 bg-white hover:border-[#4580BC] hover:bg-[#4580BC]/5"
												} ${
													isCompleted ? "opacity-75 cursor-not-allowed" : ""
												}`}
											>
												{awayTeam?.logo_url && (
													<img
														src={awayTeam.logo_url}
														alt={awayTeam.name}
														className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
													/>
												)}
												<div className="flex-1 text-left min-w-0">
													<div className="font-semibold text-sm text-gray-900 truncate">
														{awayTeam?.name || game.away_team}
													</div>
													<div className="text-xs text-gray-500">
														{game.away_team}
													</div>
												</div>
												{/* Show score for completed games */}
												{isCompleted && hasScores && (
													<div className="text-lg md:text-xl font-bold text-gray-900">
														{game.away_score}
													</div>
												)}
											</button>

											{/* @ Symbol */}
											<div className="text-gray-400 font-bold text-base md:text-lg">
												@
											</div>

											{/* Home Team Button */}
											<button
												type="button"
												onClick={() =>
													handlePickChange(game.id, game.home_team)
												}
												disabled={isCompleted}
												className={`flex items-center space-x-2 p-2 md:p-2.5 rounded border-2 transition-all flex-1 ${
													userPick?.pickedTeam === game.home_team
														? pickCorrect === true
															? "border-[#10B981] bg-[#10B981]/10"
															: pickCorrect === false
															? "border-[#EF4444] bg-[#EF4444]/10"
															: "border-[#4580BC] bg-[#4580BC]/10"
														: "border-gray-200 bg-white hover:border-[#4580BC] hover:bg-[#4580BC]/5"
												} ${
													isCompleted ? "opacity-75 cursor-not-allowed" : ""
												}`}
											>
												{homeTeam?.logo_url && (
													<img
														src={homeTeam.logo_url}
														alt={homeTeam.name}
														className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
													/>
												)}
												<div className="flex-1 text-left min-w-0">
													<div className="font-semibold text-sm text-gray-900 truncate">
														{homeTeam?.name || game.home_team}
													</div>
													<div className="text-xs text-gray-500">
														{game.home_team}
													</div>
												</div>
												{/* Show score for completed games */}
												{isCompleted && hasScores && (
													<div className="text-lg md:text-xl font-bold text-gray-900">
														{game.home_score}
													</div>
												)}
											</button>
										</div>
									</div>
								) : (
									/* Locked Game Display - Compact */
									<div className="mb-2">
										<div className="flex items-center gap-2 md:gap-3">
											{/* Locked Away Team */}
											<div
												className={`flex items-center space-x-2 p-2 md:p-2.5 rounded border-2 flex-1 ${
													userPick?.pickedTeam === game.away_team
														? pickCorrect === true
															? "border-[#10B981] bg-[#10B981]/10"
															: pickCorrect === false
															? "border-[#EF4444] bg-[#EF4444]/10"
															: "border-[#7D1D3F] bg-[#7D1D3F]/10"
														: "border-gray-200 bg-gray-50 opacity-60"
												}`}
											>
												{awayTeam?.logo_url && (
													<img
														src={awayTeam.logo_url}
														alt={awayTeam.name}
														className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
													/>
												)}
												<div className="flex-1 text-left min-w-0">
													<div className="font-semibold text-sm text-gray-900 truncate">
														{awayTeam?.name || game.away_team}
													</div>
													<div className="text-xs text-gray-500">
														{game.away_team}
													</div>
												</div>
												{/* Show score for completed games */}
												{isCompleted && hasScores && (
													<div className="text-lg md:text-xl font-bold text-gray-900">
														{game.away_score}
													</div>
												)}
											</div>

											{/* @ Symbol */}
											<div className="text-gray-400 font-bold text-base md:text-lg">
												@
											</div>

											{/* Locked Home Team */}
											<div
												className={`flex items-center space-x-2 p-2 md:p-2.5 rounded border-2 flex-1 ${
													userPick?.pickedTeam === game.home_team
														? pickCorrect === true
															? "border-[#10B981] bg-[#10B981]/10"
															: pickCorrect === false
															? "border-[#EF4444] bg-[#EF4444]/10"
															: "border-[#7D1D3F] bg-[#7D1D3F]/10"
														: "border-gray-200 bg-gray-50 opacity-60"
												}`}
											>
												{homeTeam?.logo_url && (
													<img
														src={homeTeam.logo_url}
														alt={homeTeam.name}
														className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0"
													/>
												)}
												<div className="flex-1 text-left min-w-0">
													<div className="font-semibold text-sm text-gray-900 truncate">
														{homeTeam?.name || game.home_team}
													</div>
													<div className="text-xs text-gray-500">
														{game.home_team}
													</div>
												</div>
												{/* Show score for completed games */}
												{isCompleted && hasScores && (
													<div className="text-lg md:text-xl font-bold text-gray-900">
														{game.home_score}
													</div>
												)}
											</div>
										</div>
									</div>
								)}

								{/* Odds Display - Show spread and over/under */}
								{(game.spread != null || game.over_under != null) && (
									<div className="mb-4">
										<div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-700">
											{game.spread != null &&
												(() => {
													const spreadValue = Number(game.spread)
													// Spread is always from home team's perspective:
													// Negative = home team favored (e.g., -7.5 means home team favored by 7.5)
													// Positive = away team favored (e.g., +7.5 means home team is underdog by 7.5)
													// Always show the home team with the spread value
													const teamName =
														homeTeam?.name ||
														homeTeam?.display_name ||
														game.home_team
													if (spreadValue === 0) {
														// Pick 'em (spread is 0)
														return (
															<div>
																<span className="font-semibold text-gray-900">
																	Pick 'em
																</span>
															</div>
														)
													} else {
														// Show home team with spread (negative or positive)
														return (
															<div>
																<span className="font-semibold text-gray-900">
																	{teamName}{" "}
																	{spreadValue > 0
																		? `+${spreadValue}`
																		: spreadValue}
																</span>
															</div>
														)
													}
												})()}
											{game.over_under != null && (
												<div>
													<span>O/U: </span>
													<span className="font-semibold text-gray-900">
														{game.over_under}
													</span>
												</div>
											)}
										</div>
									</div>
								)}

								{/* Confidence Points - Button Row */}
								<div className="mb-2">
									<div className="flex flex-wrap gap-1 md:gap-1.5 justify-center">
										{Array.from(
											{ length: filteredGames.length },
											(_, i) => i + 1
										).map((point) => {
											const isUsed = getUsedConfidencePoints().includes(point)
											const isCurrent = userPick?.confidencePoints === point
											const usedByGame = userPicks.find(
												(p) =>
													p.confidencePoints === point &&
													String(p.gameId).trim() !== String(game.id).trim()
											)

											// Check if this point is assigned to a locked game
											// If usedByGame exists, find the game and check if it's locked
											let usedByLockedGame = null
											if (usedByGame) {
												const gameUsingPoint = games.find((g) => {
													const usedGameId = String(usedByGame.gameId).trim()
													const gameId = String(g.id).trim()
													return usedGameId === gameId
												})
												if (gameUsingPoint && isGameLocked(gameUsingPoint)) {
													usedByLockedGame = gameUsingPoint
												}
											}

											// Check if this game was just cleared and this is the point that was cleared
											const wasJustCleared =
												userPick?.justCleared &&
												userPick?.clearedPoint === point

											// Disable button ONLY if:
											// 1. This game is locked (all buttons disabled)
											// 2. This point is assigned to a LOCKED game (only this button disabled)
											// If the point is used by an UNLOCKED game, it should still be clickable to reassign
											const isDisabled = isLocked || usedByLockedGame !== null

											return (
												<button
													key={point}
													type="button"
													onClick={() =>
														!isDisabled &&
														handleConfidenceChange(game.id, point)
													}
													disabled={isDisabled}
													className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all ${
														isCurrent
															? "bg-[#265387] text-white shadow-md border-2 border-[#265387]"
															: wasJustCleared
															? "bg-[#EF4444] text-white border-2 border-[#EF4444]"
															: isUsed && usedByLockedGame
															? "bg-gray-200 text-gray-500 border-2 border-gray-200 opacity-50 cursor-not-allowed"
															: isUsed && !usedByLockedGame
															? "bg-gray-200 text-gray-500 hover:bg-gray-300 border-2 border-gray-200"
															: "bg-white text-gray-700 border-2 border-gray-300 hover:border-[#4580BC] hover:bg-[#4580BC]/10"
													} ${
														isDisabled ? "opacity-75 cursor-not-allowed" : ""
													}`}
													title={
														wasJustCleared
															? `This confidence point was just moved to another game`
															: usedByLockedGame
															? `This point is assigned to a locked game and cannot be changed`
															: usedByGame
															? `Currently used by another game (click to reassign)`
															: ""
													}
												>
													{point}
												</button>
											)
										})}
									</div>
								</div>
							</div>
						)
					})
				)}
			</div>

			{/* Submit Button */}
			{filteredGames.length > 0 && (
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-6 mb-8 md:mb-12 text-center">
					<button
						onClick={submitPicks}
						disabled={submitting || filteredGames.length === 0}
						className="bg-[#265387] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-md text-sm md:text-base font-medium hover:bg-[#1a3d6b] focus:outline-none focus:ring-2 focus:ring-[#265387] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{submitting ? "Submitting..." : "Submit Picks"}
					</button>
				</div>
			)}
		</div>
	)
}

export default function PicksPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 py-8">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4580BC] mx-auto"></div>
							<p className="mt-4 text-gray-600">Loading picks...</p>
						</div>
					</div>
				</div>
			}
		>
			<PicksPageContent />
		</Suspense>
	)
}
