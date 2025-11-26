"use client"

import Link from "next/link"

export default function Footer() {
	const currentYear = new Date().getFullYear()

	return (
		<footer className="bg-white border-t border-gray-200 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
					{/* Logo and Branding */}
					<div className="flex flex-col gap-4">
						<Link href="/" className="inline-block">
							<img
								src="/assets/pickmonster-word-logo.svg"
								alt="PickMonster"
								className="h-6 w-auto"
							/>
						</Link>
						<p className="text-xs text-gray-500">
							© {currentYear} PickMonster. All rights reserved.
						</p>
					</div>

					{/* Links */}
					<nav className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8">
						<Link
							href="/privacy"
							className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
						>
							Privacy Policy
						</Link>
						<Link
							href="/terms"
							className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
						>
							Terms of Service
						</Link>
						<Link
							href="/about"
							className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
						>
							About
						</Link>
						<Link
							href="/data"
							className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
						>
							NFL Data
						</Link>
					</nav>
				</div>
			</div>
		</footer>
	)
}

