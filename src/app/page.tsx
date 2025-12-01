"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/contexts/AuthContext"

export default function Home() {
	const { user, loading } = useAuth()

	if (loading) {
		return (
			<main className="min-h-screen flex items-center justify-center bg-white">
				<div className="text-gray-900 text-lg">Loading...</div>
			</main>
		)
	}

	if (user) {
		// User is authenticated, show dashboard link
		return (
			<main className="min-h-screen bg-white">
				<div className="container mx-auto px-4 py-16">
					<div className="text-center">
						<div className="mb-8 flex justify-center">
							<Image
								src="/assets/pickmonster-wordmark-sq.svg"
								alt="PickMonster"
								width={200}
								height={200}
								className="w-48 h-48 md:w-64 md:h-64"
								priority
							/>
						</div>
						<h1 className="text-5xl md:text-6xl font-galindo text-[#265387] mb-6">
							PickMonster
						</h1>
						<p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
							Welcome back! You&apos;re signed in and ready to make your picks.
						</p>

						<div className="mb-12">
							<Link
								href="/dashboard"
								className="bg-[#E9932D] hover:bg-[#d48429] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors inline-block"
							>
								Go to Dashboard
							</Link>
						</div>

						<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
							<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
								<h3 className="text-xl font-galindo text-[#265387] mb-3">
									Weekly Picks
								</h3>
								<p className="text-gray-700">
									Pick winners for every NFL game and assign confidence points
									to maximize your score
								</p>
							</div>

							<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
								<h3 className="text-xl font-galindo text-[#265387] mb-3">
									Live Standings
								</h3>
								<p className="text-gray-700">
									Track your performance with real-time scoring and
									weekly/season leaderboards
								</p>
							</div>

							<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
								<h3 className="text-xl font-galindo text-[#265387] mb-3">
									Win Prizes
								</h3>
								<p className="text-gray-700">
									Compete for weekly and season prizes with secure payment
									processing
								</p>
							</div>
						</div>

						<div className="mt-12 text-center">
							<p className="text-gray-600">
								built with ♥ by{" "}
								<Link
									href="https://doug.is"
									target="_blank"
									rel="noopener noreferrer"
									className="text-[#4580BC] hover:text-[#265387] underline"
								>
									Doug
								</Link>
							</p>
						</div>
					</div>
				</div>
			</main>
		)
	}

	// User is not authenticated, show sign in/up options
	return (
		<main className="min-h-screen bg-white">
			<div className="container mx-auto px-4 py-16">
				<div className="text-center">
					<div className="mb-8 flex justify-center">
						<Image
							src="/assets/pickmonster-wordmark-sq.svg"
							alt="PickMonster"
							width={200}
							height={200}
							className="w-48 h-48 md:w-64 md:h-64"
							priority
						/>
					</div>
					<p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
						Make weekly NFL picks with confidence points and compete for prizes
						in our global league
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<Link
							href="/signin"
							className="bg-[#E9932D] hover:bg-[#d48429] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
						>
							Sign In
						</Link>
						<Link
							href="/signup"
							className="bg-[#265387] hover:bg-[#1a3d6b] text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
						>
							Sign Up
						</Link>
					</div>

					<div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
						<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
							<h3 className="text-xl font-galindo text-[#265387] mb-3">
								Weekly Picks
							</h3>
							<p className="text-gray-700">
								Pick winners for every NFL game and assign confidence points to
								maximize your score
							</p>
						</div>

						<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
							<h3 className="text-xl font-galindo text-[#265387] mb-3">
								Live Standings
							</h3>
							<p className="text-gray-700">
								Track your performance with real-time scoring and weekly/season
								leaderboards
							</p>
						</div>

						<div className="bg-[#4580BC]/10 rounded-lg p-6 border border-[#4580BC]/20">
							<h3 className="text-xl font-galindo text-[#265387] mb-3">
								Win Prizes
							</h3>
							<p className="text-gray-700">
								Compete for weekly and season prizes with secure payment
								processing
							</p>
						</div>
					</div>

					<div className="mt-12 text-center">
						<p className="text-gray-600">
							built with ♥ by{" "}
							<Link
								href="https://doug.is"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#4580BC] hover:text-[#265387] underline"
							>
								Doug
							</Link>
						</p>
					</div>
				</div>
			</div>
		</main>
	)
}
