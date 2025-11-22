import { Suspense } from "react"
import SeasonInfo from "@/components/data/SeasonInfo"
import TeamsDisplay from "@/components/data/TeamsDisplay"
import GamesDisplay from "@/components/data/GamesDisplay"
import StandingsDisplay from "@/components/data/StandingsDisplay"
import Navigation from "@/components/layout/Navigation"

export default function DataDashboardPage() {
	return (
		<div className="min-h-screen bg-gray-50">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						NFL Data Dashboard
					</h1>
					<p className="text-gray-600">
						Real-time NFL data including teams, games, standings, and season
						information
					</p>
				</div>

				{/* Season Info */}
				<div className="mb-8">
					<Suspense
						fallback={
							<div className="bg-white rounded-lg shadow-sm border p-4">
								<div className="animate-pulse">
									<div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								</div>
							</div>
						}
					>
						<SeasonInfo />
					</Suspense>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Teams Section */}
					<div className="lg:col-span-2">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold text-gray-900 mb-2">
								Teams
							</h2>
							<p className="text-gray-600">
								Browse all NFL teams with filtering by conference and division
							</p>
						</div>
						<Suspense
							fallback={
								<div className="bg-white rounded-lg shadow-sm border p-8">
									<div className="flex justify-center items-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
										<span className="ml-2 text-gray-600">Loading teams...</span>
									</div>
								</div>
							}
						>
							<TeamsDisplay />
						</Suspense>
					</div>

					{/* Games Section */}
					<div className="lg:col-span-2">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold text-gray-900 mb-2">
								Games
							</h2>
							<p className="text-gray-600">
								View NFL games with filtering by season, week, status, and team
							</p>
						</div>
						<Suspense
							fallback={
								<div className="bg-white rounded-lg shadow-sm border p-8">
									<div className="flex justify-center items-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
										<span className="ml-2 text-gray-600">Loading games...</span>
									</div>
								</div>
							}
						>
							<GamesDisplay />
						</Suspense>
					</div>

					{/* Standings Section */}
					<div className="lg:col-span-2">
						<div className="mb-6">
							<h2 className="text-2xl font-semibold text-gray-900 mb-2">
								Standings
							</h2>
							<p className="text-gray-600">
								Current NFL standings grouped by conference with playoff
								indicators
							</p>
						</div>
						<Suspense
							fallback={
								<div className="bg-white rounded-lg shadow-sm border p-8">
									<div className="flex justify-center items-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
										<span className="ml-2 text-gray-600">
											Loading standings...
										</span>
									</div>
								</div>
							}
						>
							<StandingsDisplay />
						</Suspense>
					</div>
				</div>

				{/* Footer Info */}
				<div className="mt-12 pt-8 border-t border-gray-200">
					<div className="text-center text-sm text-gray-500">
						<p>Data provided by ESPN API • Updates automatically</p>
						<p className="mt-1">
							Use the filters above to customize your view of NFL data
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
