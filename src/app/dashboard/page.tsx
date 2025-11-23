"use client"

import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Navigation from "@/components/layout/Navigation"
import type { SeasonStanding } from "@/lib/types/database"

export default function DashboardPage() {
	const { user, loading } = useAuth()
	const router = useRouter()
	const [userStats, setUserStats] = useState<SeasonStanding | null>(null)
	const [loadingStats, setLoadingStats] = useState(true)
	const [season] = useState("2025")

	useEffect(() => {
		if (!loading && !user) {
			router.push("/signin")
		}
	}, [user, loading, router])

	useEffect(() => {
		if (user) {
			fetchUserStats()
		}
	}, [user, season])

	const fetchUserStats = async () => {
		try {
			setLoadingStats(true)
			const response = await fetch(`/api/scores?season=${season}&type=season`)
			const data = await response.json()
			if (data.success && data.data) {
				// Find the current user's stats
				const userStanding = data.data.find((standing: SeasonStanding) => standing.user_id === user?.id)
				setUserStats(userStanding || null)
			}
		} catch (error) {
			console.error("Error fetching user stats:", error)
		} finally {
			setLoadingStats(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (!user) {
		return null // Will redirect
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />

			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="grid md:grid-cols-3 gap-8 mb-8">
						{/* NFL Data Card */}
						<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
							<div className="text-center">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									NFL Data
								</h3>
								<p className="text-gray-600 mb-4">
									Browse teams, games, standings, and season information
								</p>
								<Link
									href="/data"
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									View Data
								</Link>
							</div>
						</div>

						{/* My Picks Card */}
						<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
							<div className="text-center">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									My Picks
								</h3>
								<p className="text-gray-600 mb-4">
									Make weekly NFL picks with confidence points
								</p>
								<Link
									href="/picks"
									className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Make Picks
								</Link>
							</div>
						</div>

						{/* Leaderboard Card */}
						<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
							<div className="text-center">
								<h3 className="text-xl font-semibold text-gray-900 mb-3">
									Leaderboard
								</h3>
								<p className="text-gray-600 mb-4">
									View standings and track your performance
								</p>
								<Link
									href="/leaderboard"
									className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block"
								>
									View Leaderboard
								</Link>
							</div>
						</div>
					</div>

					{/* User Stats */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							Your Stats - Season {season}
						</h2>
						{loadingStats ? (
							<div className="text-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
								<p className="mt-4 text-gray-600">Loading stats...</p>
							</div>
						) : userStats ? (
							<div>
								<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
									<div className="text-center p-4 bg-blue-50 rounded-lg">
										<div className="text-4xl font-bold text-blue-600 mb-2">{userStats.rank}</div>
										<div className="text-gray-700 font-medium">Overall Rank</div>
										<div className="text-sm text-gray-500 mt-1">Out of all players</div>
									</div>
									<div className="text-center p-4 bg-purple-50 rounded-lg">
										<div className="text-4xl font-bold text-purple-600 mb-2">{userStats.total_points}</div>
										<div className="text-gray-700 font-medium">Total Points</div>
										<div className="text-sm text-gray-500 mt-1">Season total</div>
									</div>
									<div className="text-center p-4 bg-green-50 rounded-lg">
										<div className="text-4xl font-bold text-green-600 mb-2">
											{userStats.correct_picks}/{userStats.total_picks}
										</div>
										<div className="text-gray-700 font-medium">Correct Picks</div>
										<div className="text-sm text-gray-500 mt-1">
											{userStats.correct_picks_percentage.toFixed(1)}% accuracy
										</div>
									</div>
									<div className="text-center p-4 bg-orange-50 rounded-lg">
										<div className="text-4xl font-bold text-orange-600 mb-2">
											{userStats.average_points.toFixed(1)}
										</div>
										<div className="text-gray-700 font-medium">Avg Points/Week</div>
										<div className="text-sm text-gray-500 mt-1">
											{userStats.weeks_played} weeks played
										</div>
									</div>
								</div>
								<div className="mt-6 pt-6 border-t border-gray-200">
									<div className="flex justify-between items-center">
										<div>
											<p className="text-sm text-gray-600">Your Standing</p>
											<p className="text-lg font-semibold text-gray-900">
												#{userStats.rank} - {userStats.display_name}
											</p>
										</div>
										<Link
											href="/leaderboard"
											className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
										>
											View Full Leaderboard
										</Link>
									</div>
								</div>
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								<p>No stats available yet. Make some picks to get started!</p>
								<Link
									href="/picks"
									className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Make Your First Picks
								</Link>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	)
}
