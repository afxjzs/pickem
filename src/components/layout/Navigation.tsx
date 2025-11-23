"use client"

import { memo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

function Navigation() {
	const { user, loading, signOut } = useAuth()
	const router = useRouter()
	const pathname = usePathname()

	const handleSignOut = async () => {
		await signOut()
		router.push("/")
	}

	const isActive = (path: string) => {
		if (path === "/leaderboard") {
			return pathname === "/leaderboard"
		}
		if (path === "/group-picks") {
			return pathname === "/group-picks" || pathname.startsWith("/group-picks")
		}
		return pathname === path
	}

	// Always render the navigation structure to prevent layout shift
	// Only show content when user is authenticated
	if (!user && !loading) {
		// Not authenticated and not loading - show minimal nav or nothing
		return null
	}

	return (
		<header className="bg-white shadow">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-6">
					<div className="flex items-center space-x-8">
						<h1 className="text-3xl font-bold text-gray-900">Pick'em</h1>
						{loading ? (
							// Show loading state for nav items
							<nav className="flex items-center space-x-4">
								<div className="px-3 py-2 rounded-md text-sm font-medium text-gray-400 animate-pulse">
									Loading...
								</div>
							</nav>
						) : user ? (
							// Show full nav when authenticated
							<nav className="flex items-center space-x-4">
								<Link
									href="/dashboard"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/dashboard")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Dashboard
								</Link>
								<Link
									href="/picks"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/picks")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									My Picks
								</Link>
								<Link
									href="/leaderboard"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/leaderboard")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Leaderboard
								</Link>
								<Link
									href="/group-picks/current-week"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/group-picks")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									Group Picks
								</Link>
								<Link
									href="/data"
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive("/data")
											? "bg-gray-100 text-gray-900"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}
								>
									NFL Data
								</Link>
							</nav>
						) : (
							// Not authenticated - show minimal nav or nothing
							<nav className="flex items-center space-x-4">
								<Link
									href="/"
									className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
								>
									Home
								</Link>
							</nav>
						)}
					</div>
					<div className="flex items-center space-x-4">
						{loading ? (
							<div className="text-gray-400 animate-pulse">Loading...</div>
						) : user ? (
							<>
								<Link
									href="/profile"
									className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
								>
									{user.email}
								</Link>
								<button
									onClick={handleSignOut}
									className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Sign Out
								</button>
							</>
						) : (
							<>
								<Link
									href="/signin"
									className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
								>
									Sign In
								</Link>
								<Link
									href="/signup"
									className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	)
}

export default memo(Navigation)
