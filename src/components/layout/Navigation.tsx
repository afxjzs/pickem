"use client"

import { memo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

function Navigation() {
	const { user, signOut } = useAuth()
	const router = useRouter()
	const pathname = usePathname()

	const handleSignOut = async () => {
		await signOut()
		router.push("/")
	}

	if (!user) {
		return null
	}

	const isActive = (path: string) => {
		if (path === "/leaderboard") {
			return pathname === "/leaderboard" || pathname.startsWith("/leaderboard/")
		}
		return pathname === path
	}

	return (
		<header className="bg-white shadow">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center py-6">
					<div className="flex items-center space-x-8">
						<h1 className="text-3xl font-bold text-gray-900">Pick'em</h1>
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
									isActive("/leaderboard") || isActive("/leaderboard/picks")
										? "bg-gray-100 text-gray-900"
										: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
								}`}
							>
								Leaderboard
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
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-gray-700">Welcome, {user.email}</span>
						<button
							onClick={handleSignOut}
							className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
						>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		</header>
	)
}

export default memo(Navigation)
