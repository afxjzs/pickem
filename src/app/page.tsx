"use client"

import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function Home() {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#4580BC' }}>
				<div className="text-white text-lg">Loading...</div>
			</main>
		)
	}

	if (user) {
		// User is authenticated, show dashboard link
		return (
			<main className="min-h-screen" style={{ backgroundColor: '#4580BC' }}>
				<div className="container mx-auto px-4 py-16">
					<div className="text-center">
						<h1 className="text-6xl font-galindo text-white mb-6">Pick&apos;em</h1>
						<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
							Welcome back! You&apos;re signed in and ready to make your picks.
						</p>

						<div className="mb-12">
							<Link
								href="/dashboard"
								className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
							>
								Go to Dashboard
							</Link>
						</div>

						<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
							<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
								<h3 className="text-xl font-galindo text-white mb-3">
									Weekly Picks
								</h3>
								<p className="text-white/90">
									Pick winners for every NFL game and assign confidence points
									to maximize your score
								</p>
							</div>

							<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
								<h3 className="text-xl font-galindo text-white mb-3">
									Live Standings
								</h3>
								<p className="text-white/90">
									Track your performance with real-time scoring and
									weekly/season leaderboards
								</p>
							</div>

							<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
								<h3 className="text-xl font-galindo text-white mb-3">
									Win Prizes
								</h3>
								<p className="text-white/90">
									Compete for weekly and season prizes with secure payment
									processing
								</p>
							</div>
						</div>
					</div>
				</div>
			</main>
		)
	}

	// User is not authenticated, show sign in/up options
	return (
		<main className="min-h-screen" style={{ backgroundColor: '#4580BC' }}>
			<div className="container mx-auto px-4 py-16">
				<div className="text-center">
					<h1 className="text-6xl font-galindo text-white mb-6">Pick&apos;em</h1>
					<p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
						Make weekly NFL picks with confidence points and compete for prizes
						in our global league
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<Link
							href="/signin"
							className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
						>
							Sign In
						</Link>
						<Link
							href="/signup"
							className="bg-[#4580BC] hover:bg-[#265387] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors border-2 border-white/30"
						>
							Sign Up
						</Link>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
							<h3 className="text-xl font-galindo text-white mb-3">
								Weekly Picks
							</h3>
							<p className="text-white/90">
								Pick winners for every NFL game and assign confidence points to
								maximize your score
							</p>
						</div>

						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
							<h3 className="text-xl font-galindo text-white mb-3">
								Live Standings
							</h3>
							<p className="text-white/90">
								Track your performance with real-time scoring and weekly/season
								leaderboards
							</p>
						</div>

						<div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
							<h3 className="text-xl font-galindo text-white mb-3">
								Win Prizes
							</h3>
							<p className="text-white/90">
								Compete for weekly and season prizes with secure payment
								processing
							</p>
						</div>
					</div>
				</div>
			</div>
		</main>
	)
}
