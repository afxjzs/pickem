"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter, useSearchParams } from "next/navigation"
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
}

function PicksPageContent() {
	const { user, loading: authLoading } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [games, setGames] = useState<GameWithTeams[]>([])
	const [teams, setTeams] = useState<Team[]>([])
	const [userPicks, setUserPicks] = useState<UserPick[]>([])
	const [season, setSeason] = useState("2025")
	const [week, setWeek] = useState(12) // Default to week 12 for testing
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)
	const [currentWeek, setCurrentWeek] = useState<number | null>(null)
	const [debugInfo, setDebugInfo] = useState<any>(null)
	const [checkingOnboarding, setCheckingOnboarding] = useState(true)

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

	// Initialize week from URL or fetch current week
	useEffect(() => {
		const weekParam = searchParams.get("week")
		if (weekParam) {
			const weekNum = parseInt(weekParam, 10)
			if (!isNaN(weekNum) && weekNum >= 1 && weekNum <= 18) {
				setWeek(weekNum)
			}
		} else {
			// Fetch current week if not in URL
			const fetchCurrentWeek = async () => {
				try {
					const response = await fetch("/api/season")
					const data = await response.json()
					if (data.success && data.data.currentWeek) {
						const weekNum = data.data.currentWeek
						setCurrentWeek(weekNum)
						setWeek(weekNum)
						// Update URL to include week
						router.replace(`/picks?week=${weekNum}`, { scroll: false })
					} else {
						// Default to week 12 for testing
						setWeek(12)
						router.replace(`/picks?week=12`, { scroll: false })
					}
				} catch (error) {
					console.error("Error fetching current week:", error)
					// Default to week 12 for testing
					setWeek(12)
					router.replace(`/picks?week=12`, { scroll: false })
				}
			}
			fetchCurrentWeek()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // Only run once on mount

	// Update URL when week changes via dropdown (not from URL)
	const handleWeekChange = (newWeek: number) => {
		setWeek(newWeek)
		router.push(`/picks?week=${newWeek}`, { scroll: false })
	}

	useEffect(() => {
		if (user) {
			// Fetch games first, then picks (picks need games to match against)
			fetchGames()
			fetchTeams()
		}
	}, [user, season, week])

	// Fetch picks after games are loaded
	// Clear picks when week changes to avoid showing picks from other weeks
	useEffect(() => {
		if (user && games.length > 0) {
			// Clear picks from other weeks first
			setUserPicks([])
			// Then fetch picks for current week
			fetchUserPicks()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, season, week, games.length])

	const fetchGames = async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/games?season=${season}&week=${week}`)
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
						return game.id && game.id !== null && game.id !== undefined && game.id !== ""
					})
					.map((game: GameWithTeams) => {
						// Ensure id is a string for consistent comparison
						return { ...game, id: String(game.id) }
					})
				
				setGames(validGames)
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

	const fetchUserPicks = async () => {
		try {
			const response = await fetch(`/api/picks?season=${season}&week=${week}`, {
				credentials: 'include',
			})
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
				}))
				
				// Get current week's game IDs to filter picks
				const currentWeekGameIds = new Set(games.map(g => String(g.id).trim()))
				
				// Only keep picks for current week's games (API should already filter, but be safe)
				const filteredPicks = picks.filter(pick => 
					currentWeekGameIds.has(String(pick.gameId).trim())
				)
				
				// Replace picks entirely - API already filters by week, so we don't need to merge
				// This ensures we don't show picks from other weeks
				setUserPicks(filteredPicks)
			}
		} catch (error) {
			console.error("Error fetching user picks:", error)
		}
	}

	const savePick = async (pick: UserPick) => {
		if (!user || !pick.pickedTeam) {
			console.warn("[savePick] Skipping save - no user or team:", { hasUser: !!user, hasTeam: !!pick.pickedTeam })
			return // Don't save incomplete picks (team is required)
		}

		console.log("[savePick] Attempting to save pick:", { gameId: pick.gameId, team: pick.pickedTeam, points: pick.confidencePoints })

		// Set saving state
		setUserPicks(prev => prev.map(p => 
			String(p.gameId).trim() === String(pick.gameId).trim() 
				? { ...p, saving: true, saved: false }
				: p
		))

		try {
			// First, test auth
			const authTest = await fetch("/api/auth-test", { credentials: 'include' })
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
					errorMsg += "Your session may be invalid. Please sign out and sign in again."
				} else if (authData.session?.error) {
					errorMsg += "Session error: " + authData.session.error
				} else {
					errorMsg += "Please refresh the page and try again."
				}
				
				setMessage({ text: errorMsg, type: "error" })
				// Clear saving state on error
				setUserPicks(prev => prev.map(p => 
					String(p.gameId).trim() === String(pick.gameId).trim() 
						? { ...p, saving: false, saved: false }
						: p
				))
				return
			}
			
			// Check if user exists in database (warn but don't block - user might not have a users table row yet)
			if (authData.database && !authData.database.exists) {
				console.warn("[savePick] User not found in users table (but authenticated):", authData.database)
				// Don't block saving - the user is authenticated, which is what matters for picks
				// The users table row might be created later or might not be required
			}

			// Try POST first (for new picks), then PUT if it fails because pick exists
			const response = await fetch("/api/picks", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: 'include',
				body: JSON.stringify({
					gameId: pick.gameId,
					pickedTeam: pick.pickedTeam,
					confidencePoints: pick.confidencePoints || 0,
				}),
			})

			const data = await response.json()
			console.log("[savePick] POST response:", { success: data.success, message: data.message, status: response.status })
			
			if (!data.success) {
				// If POST fails because pick exists, try PUT
				if (data.message?.includes("already has a pick")) {
					console.log("[savePick] Pick exists, trying PUT...")
					const putResponse = await fetch("/api/picks", {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
						},
						credentials: 'include',
						body: JSON.stringify({
							gameId: pick.gameId,
							pickedTeam: pick.pickedTeam,
							confidencePoints: pick.confidencePoints || 0,
						}),
					})
					const putData = await putResponse.json()
					console.log("[savePick] PUT response:", { success: putData.success, message: putData.message, status: putResponse.status })
					if (!putData.success) {
						console.error("[savePick] Failed to update pick:", putData.message)
						setMessage({ text: `Failed to save pick: ${putData.message}`, type: "error" })
						// Clear saving state on error
						setUserPicks(prev => prev.map(p => 
							String(p.gameId).trim() === String(pick.gameId).trim() 
								? { ...p, saving: false, saved: false }
								: p
						))
					} else {
						console.log("[savePick] Pick updated successfully")
						// Set saved state (no message - checkmark will show)
						setUserPicks(prev => prev.map(p => 
							String(p.gameId).trim() === String(pick.gameId).trim() 
								? { ...p, saving: false, saved: true }
								: p
						))
					}
				} else {
					console.error("[savePick] Failed to save pick:", data.message)
					setMessage({ text: `Failed to save pick: ${data.message}`, type: "error" })
					// Clear saving state on error
					setUserPicks(prev => prev.map(p => 
						String(p.gameId).trim() === String(pick.gameId).trim() 
							? { ...p, saving: false, saved: false }
							: p
					))
				}
			} else {
				console.log("[savePick] Pick saved successfully")
				// Set saved state (no message - checkmark will show)
				setUserPicks(prev => prev.map(p => 
					String(p.gameId).trim() === String(pick.gameId).trim() 
						? { ...p, saving: false, saved: true }
						: p
				))
			}
		} catch (error) {
			console.error("[savePick] Error saving pick:", error)
			setMessage({ text: `Error saving pick: ${error instanceof Error ? error.message : String(error)}`, type: "error" })
			// Clear saving state on error
			setUserPicks(prev => prev.map(p => 
				String(p.gameId).trim() === String(pick.gameId).trim() 
					? { ...p, saving: false, saved: false }
					: p
			))
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
				return pickGameId === normalizedGameId && pickGameId !== "" && normalizedGameId !== ""
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
				updated = [...prev, { gameId: normalizedGameId, pickedTeam, confidencePoints: 0, saving: false, saved: false }]
			}
			
			// Auto-save if pick has a team selected (even if confidence points not set yet)
			const updatedPick = updated.find((p) => String(p.gameId).trim() === normalizedGameId)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}
			
			return updated
		})
	}

	const handleConfidenceChange = async (gameId: string, confidencePoints: number) => {
		if (!gameId || gameId === "undefined" || gameId === "null") {
			console.error("Invalid gameId:", gameId)
			return
		}

		// Normalize the gameId for comparison
		const normalizedGameId = String(gameId).trim()
		
		// Find if this confidence point is already used by another game
		const pointUsedBy = userPicks.find(
			(p) => p.confidencePoints === confidencePoints && String(p.gameId).trim() !== normalizedGameId
		)
		
		// If this point is used by another game, clear it first (before updating the new pick)
		if (pointUsedBy && pointUsedBy.pickedTeam) {
			const clearedPick: UserPick = {
				...pointUsedBy,
				confidencePoints: 0,
				saved: false,
			}
			
			// Update state immediately for UI responsiveness
			setUserPicks((prev) => prev.map((p) => 
				String(p.gameId).trim() === String(pointUsedBy.gameId).trim()
					? clearedPick
					: p
			))
			
			// Save the cleared pick FIRST (await to ensure it completes)
			await savePick(clearedPick)
		}
		
		// Now update the state for the new pick
		setUserPicks((prev) => {
			const existingIndex = prev.findIndex((p) => {
				const pickGameId = String(p.gameId).trim()
				return pickGameId === normalizedGameId && pickGameId !== "" && normalizedGameId !== ""
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
						}
					}
					return pick
				})
			} else {
				// Add new pick for this game (but keep existing pickedTeam if any)
				const existingPick = prev.find((p) => String(p.gameId).trim() === normalizedGameId)
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
			const updatedPick = updated.find((p) => String(p.gameId).trim() === normalizedGameId)
			if (updatedPick && updatedPick.pickedTeam) {
				savePick(updatedPick)
			}
			
			return updated
		})
	}

	const getUsedConfidencePoints = () => {
		// Only count confidence points used for games in the current week
		const currentWeekGameIds = new Set(games.map(g => String(g.id).trim()))
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
			setMessage({ text: "Each confidence point can only be used once per week", type: "error" })
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
				type: "error"
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
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading games...</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Make Your Picks
					</h1>
					<p className="text-gray-600 mb-6">
						Pick the winner of each game and assign confidence points (1-16).
						Each confidence point can only be used once per week.
					</p>
					
					{/* Picks Status Indicator */}
					{(() => {
						// Count non-locked games
						const nonLockedGames = games.filter((g) => !isGameLocked(g))
						// Count complete picks (has both winner and confidence points > 0)
						const completePicks = userPicks.filter((pick) => {
							const game = games.find((g) => String(g.id).trim() === String(pick.gameId).trim())
							return game && !isGameLocked(game) && pick.pickedTeam && pick.confidencePoints > 0
						})
						const isComplete = nonLockedGames.length > 0 && completePicks.length === nonLockedGames.length
						
						return (
							<div className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
								isComplete 
									? "bg-green-100 text-green-800" 
									: "bg-gray-100 text-gray-800"
							}`}>
								Picks: {isComplete ? "Complete" : "Incomplete"}
							</div>
						)
					})()}

					{/* Controls */}
					<div className="flex flex-wrap gap-4 items-center mb-6">
						<div>
							<label
								htmlFor="season"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Season
							</label>
							<select
								id="season"
								value={season}
								onChange={(e) => setSeason(e.target.value)}
								className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option value="2025">2025</option>
							</select>
						</div>

						<div>
							<label
								htmlFor="week"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Week
							</label>
							<select
								id="week"
								value={week}
								onChange={(e) => handleWeekChange(parseInt(e.target.value))}
								className="bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
									<option key={w} value={w}>
										Week {w}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Message */}
					{message && (
						<div
							className={`p-4 rounded-md mb-6 ${
								message.type === "success"
									? "bg-green-50 text-green-800 border border-green-200"
									: message.type === "error"
									? "bg-red-50 text-red-800 border border-red-200"
									: "bg-blue-50 text-blue-800 border border-blue-200"
							}`}
						>
							{message.text}
						</div>
					)}

					{/* Debug Panel - Only show if there's debug info */}
					{debugInfo && (
						<div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-md">
							<div className="mb-3 flex items-center justify-between">
								<h3 className="font-bold text-yellow-900 text-lg">🔍 Debug Info</h3>
								<button
									onClick={() => setDebugInfo(null)}
									className="text-sm text-yellow-700 hover:text-yellow-900 underline font-semibold"
								>
									✕ Clear
								</button>
							</div>
							<div className="bg-white p-4 rounded border-2 border-yellow-300">
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">Authentication Status:</h4>
									<div className={`p-3 rounded ${debugInfo.auth?.hasUser ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
										<strong>User Found:</strong> {debugInfo.auth?.hasUser ? '✅ Yes' : '❌ No'}<br/>
										{debugInfo.auth?.userId && <><strong>User ID:</strong> {debugInfo.auth.userId}<br/></>}
										{debugInfo.auth?.error && <><strong>Error:</strong> {debugInfo.auth.error}</>}
									</div>
								</div>
								<div className="mb-4">
									<h4 className="font-semibold text-gray-900 mb-2">Cookies Found ({debugInfo.cookies?.length || 0}):</h4>
									<div className="bg-gray-50 p-3 rounded border max-h-48 overflow-y-auto">
										{debugInfo.cookies?.map((cookie: any, idx: number) => (
											<div key={idx} className="mb-2 pb-2 border-b border-gray-200 last:border-0">
												<strong className="text-gray-800">{cookie.name}</strong><br/>
												<span className="text-sm text-gray-600">
													Has Value: {cookie.hasValue ? '✅' : '❌'} | 
													Length: {cookie.valueLength || 0}
												</span>
											</div>
										))}
									</div>
								</div>
								<div>
									<h4 className="font-semibold text-gray-900 mb-2">Full JSON:</h4>
									<pre className="text-xs overflow-auto max-h-64 bg-gray-50 p-3 rounded border font-mono text-gray-900 font-medium">
										{JSON.stringify(debugInfo, null, 2)}
									</pre>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Games */}
				<div className="space-y-6">
					{games.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-gray-500">No games found for Week {week}</p>
						</div>
					) : (
						games.map((game) => {
								// Find the pick for THIS specific game by matching gameId
								// Use strict comparison with normalized IDs
								const gameIdStr = String(game.id).trim()
								const userPick = userPicks.find((p) => {
									const pickGameIdStr = String(p.gameId).trim()
									return pickGameIdStr === gameIdStr && pickGameIdStr !== "" && gameIdStr !== ""
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
							const hasScores = game.home_score !== null && game.home_score !== undefined && game.away_score !== null && game.away_score !== undefined
							const winningTeam = hasScores && isCompleted
								? (game.home_score! > game.away_score! ? game.home_team : game.away_team)
								: null
							
							// Determine if user's pick was correct
							const pickCorrect = userPick?.pickedTeam && winningTeam
								? userPick.pickedTeam === winningTeam
								: null

							return (
								<div
									key={`game-${game.id || `index-${games.indexOf(game)}`}`}
									className="bg-white rounded-lg shadow p-6 relative"
								>
									{/* Save Status Indicator - Upper Right */}
									<div className="absolute top-4 right-4">
										{isLocked ? (
											<div className="text-gray-500">
												<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
												</svg>
											</div>
										) : (
											<>
												{userPick?.saving && (
													<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
												)}
												{!userPick?.saving && (() => {
													// Check if pick is complete (has both winner and confidence points)
													const isComplete = userPick?.pickedTeam && userPick?.confidencePoints > 0
													
													if (isComplete && userPick?.saved) {
														// Complete and saved - green checkmark
														return (
															<div className="text-green-600">
																<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																	<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
																</svg>
															</div>
														)
													} else if (userPick && (!userPick.pickedTeam || userPick.confidencePoints === 0)) {
														// Incomplete - yellow warning icon (circle with horizontal bar/minus)
														return (
															<div className="text-yellow-600">
																<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																	<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
																</svg>
															</div>
														)
													}
													return null
												})()}
											</>
										)}
									</div>

									{/* Game Header */}
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-3">
											<span className="text-sm font-medium text-gray-500">
												Week {game.week}
											</span>
											{game.is_snf && (
												<span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
													SNF
												</span>
											)}
											{game.is_mnf && (
												<span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
													MNF
												</span>
											)}
										</div>
									</div>


									{/* Teams - Button-based Selection */}
									{!isLocked ? (
										<div className="mb-4">
											<div className="flex items-center gap-4">
												{/* Away Team Button */}
												<button
													type="button"
													onClick={() => handlePickChange(game.id, game.away_team)}
													disabled={isCompleted}
													className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all flex-1 ${
														userPick?.pickedTeam === game.away_team
															? pickCorrect === true
																? "border-green-500 bg-green-50 shadow-md"
																: pickCorrect === false
																? "border-red-500 bg-red-50 shadow-md"
																: "border-blue-500 bg-blue-50 shadow-md"
															: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
													} ${isCompleted ? "opacity-75 cursor-not-allowed" : ""}`}
												>
													{awayTeam?.logo_url && (
														<img
															src={awayTeam.logo_url}
															alt={awayTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{awayTeam?.name || game.away_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.away_team}
														</div>
													</div>
													{/* Show score for completed games */}
													{isCompleted && hasScores && (
														<div className="text-2xl font-bold text-gray-900">
															{game.away_score}
														</div>
													)}
													{userPick?.pickedTeam === game.away_team && !isCompleted && (
														<div className="text-blue-600">
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
															</svg>
														</div>
													)}
												</button>

												{/* @ Symbol */}
												<div className="text-gray-400 font-bold text-xl">@</div>

												{/* Home Team Button */}
												<button
													type="button"
													onClick={() => handlePickChange(game.id, game.home_team)}
													disabled={isCompleted}
													className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all flex-1 ${
														userPick?.pickedTeam === game.home_team
															? pickCorrect === true
																? "border-green-500 bg-green-50 shadow-md"
																: pickCorrect === false
																? "border-red-500 bg-red-50 shadow-md"
																: "border-blue-500 bg-blue-50 shadow-md"
															: "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
													} ${isCompleted ? "opacity-75 cursor-not-allowed" : ""}`}
												>
													{homeTeam?.logo_url && (
														<img
															src={homeTeam.logo_url}
															alt={homeTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{homeTeam?.name || game.home_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.home_team}
														</div>
													</div>
													{/* Show score for completed games */}
													{isCompleted && hasScores && (
														<div className="text-2xl font-bold text-gray-900">
															{game.home_score}
														</div>
													)}
													{userPick?.pickedTeam === game.home_team && !isCompleted && (
														<div className="text-blue-600">
															<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
																<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
															</svg>
														</div>
													)}
												</button>
											</div>

											{/* Game Time */}
											<div className="text-center mt-2 text-sm text-gray-500">
												{new Date(game.start_time).toLocaleDateString([], {
													weekday: "short",
													month: "short",
													day: "numeric",
												})}{" "}
												{new Date(game.start_time).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</div>
										</div>
									) : (
										/* Locked Game Display */
										<div className="mb-4">
											<div className="flex items-center gap-4">
												{/* Locked Away Team */}
												<div className={`flex items-center space-x-3 p-4 rounded-lg border-2 flex-1 ${
													userPick?.pickedTeam === game.away_team
														? pickCorrect === true
															? "border-green-500 bg-green-50"
															: pickCorrect === false
															? "border-red-500 bg-red-50"
															: "border-gray-200 bg-gray-50"
														: "border-gray-200 bg-gray-50 opacity-60"
												}`}>
													{awayTeam?.logo_url && (
														<img
															src={awayTeam.logo_url}
															alt={awayTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{awayTeam?.name || game.away_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.away_team}
														</div>
													</div>
													{/* Show score for completed games */}
													{isCompleted && hasScores && (
														<div className="text-2xl font-bold text-gray-900">
															{game.away_score}
														</div>
													)}
												</div>

												{/* @ Symbol */}
												<div className="text-gray-400 font-bold text-xl">@</div>

												{/* Locked Home Team */}
												<div className={`flex items-center space-x-3 p-4 rounded-lg border-2 flex-1 ${
													userPick?.pickedTeam === game.home_team
														? pickCorrect === true
															? "border-green-500 bg-green-50"
															: pickCorrect === false
															? "border-red-500 bg-red-50"
															: "border-gray-200 bg-gray-50"
														: "border-gray-200 bg-gray-50 opacity-60"
												}`}>
													{homeTeam?.logo_url && (
														<img
															src={homeTeam.logo_url}
															alt={homeTeam.name}
															className="w-12 h-12 flex-shrink-0"
														/>
													)}
													<div className="flex-1 text-left">
														<div className="font-semibold text-gray-900">
															{homeTeam?.name || game.home_team}
														</div>
														<div className="text-sm text-gray-500">
															{game.home_team}
														</div>
													</div>
													{/* Show score for completed games */}
													{isCompleted && hasScores && (
														<div className="text-2xl font-bold text-gray-900">
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
												{game.spread != null && (() => {
													const spreadValue = Number(game.spread)
													// Spread is always from home team's perspective:
													// Negative = home team favored (e.g., -7.5 means home team favored by 7.5)
													// Positive = away team favored (e.g., +7.5 means home team is underdog by 7.5)
													// Always show the home team with the spread value
													const teamName = homeTeam?.name || homeTeam?.display_name || game.home_team
													if (spreadValue === 0) {
														// Pick 'em (spread is 0)
														return (
															<div>
																<span className="font-semibold text-gray-900">Pick 'em</span>
															</div>
														)
													} else {
														// Show home team with spread (negative or positive)
														return (
															<div>
																<span className="font-semibold text-gray-900">
																	{teamName} {spreadValue > 0 ? `+${spreadValue}` : spreadValue}
																</span>
															</div>
														)
													}
												})()}
												{game.over_under != null && (
													<div>
														<span>O/U: </span>
														<span className="font-semibold text-gray-900">{game.over_under}</span>
													</div>
												)}
											</div>
										</div>
									)}

									{/* Confidence Points - Button Row */}
									<div className="mb-4">
										<div className="flex flex-wrap gap-2 justify-center">
											{Array.from({ length: games.length }, (_, i) => i + 1).map((point) => {
												const isUsed = getUsedConfidencePoints().includes(point)
												const isCurrent = userPick?.confidencePoints === point
												const usedByGame = userPicks.find((p) => p.confidencePoints === point && String(p.gameId).trim() !== String(game.id).trim())
												
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
												
												// Disable button ONLY if:
												// 1. This game is locked (all buttons disabled)
												// 2. This point is assigned to a LOCKED game (only this button disabled)
												// If the point is used by an UNLOCKED game, it should still be clickable to reassign
												const isDisabled = isLocked || (usedByLockedGame !== null)
												
												return (
													<button
														key={point}
														type="button"
														onClick={() => !isDisabled && handleConfidenceChange(game.id, point)}
														disabled={isDisabled}
														className={`px-4 py-2 rounded-md font-medium transition-all ${
															isCurrent
																? "bg-blue-600 text-white shadow-md border-2 border-blue-600"
																: isUsed && usedByLockedGame
																? "bg-gray-200 text-gray-500 border-2 border-gray-200 opacity-50 cursor-not-allowed"
																: isUsed && !usedByLockedGame
																? "bg-gray-200 text-gray-500 hover:bg-gray-300 border-2 border-gray-200"
																: "bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
														} ${isDisabled ? "opacity-75 cursor-not-allowed" : ""}`}
														title={
															usedByLockedGame 
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
				{games.length > 0 && (
					<div className="mt-8 text-center">
						<button
							onClick={submitPicks}
							disabled={submitting || games.length === 0}
							className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? "Submitting..." : "Submit Picks"}
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default function PicksPage() {
	return (
		<Suspense fallback={
			<div className="min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
						<p className="mt-4 text-gray-600">Loading picks...</p>
					</div>
				</div>
			</div>
		}>
			<PicksPageContent />
		</Suspense>
	)
}
