"use client"

import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navigation from "@/components/layout/Navigation"

export default function DashboardPage() {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) {
			router.push("/signin")
		}
	}, [user, loading, router])

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
								<a
									href="/data"
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									View Data
								</a>
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
								<a
									href="/picks"
									className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Make Picks
								</a>
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
								<button
									disabled
									className="bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed"
									title="Coming soon"
								>
									Coming Soon
								</button>
							</div>
						</div>
					</div>

					{/* Quick Stats */}
					<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
						<h2 className="text-2xl font-semibold text-gray-900 mb-4">
							Quick Stats
						</h2>
						<div className="grid md:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="text-3xl font-bold text-blue-600">0</div>
								<div className="text-gray-600">Picks Made</div>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-green-600">0</div>
								<div className="text-gray-600">Correct Picks</div>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-purple-600">0</div>
								<div className="text-gray-600">Total Points</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
