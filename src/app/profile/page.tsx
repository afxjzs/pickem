"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { User } from "@/lib/types/database"

export default function ProfilePage() {
	const { user: authUser, loading: authLoading } = useAuth()
	const router = useRouter()
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [username, setUsername] = useState("")
	const [avatarUrl, setAvatarUrl] = useState("")
	const [usernameError, setUsernameError] = useState<string | null>(null)
	const [isCheckingUsername, setIsCheckingUsername] = useState(false)
	const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const originalUsernameRef = useRef<string>("")

	// Redirect if not authenticated
	useEffect(() => {
		if (!authLoading && !authUser) {
			router.push("/signin")
		}
	}, [authUser, authLoading, router])

	// Fetch user profile
	useEffect(() => {
		if (authUser) {
			fetchProfile()
		}
	}, [authUser])

	// Check username availability when it changes
	useEffect(() => {
		if (username.trim().length === 0) {
			setUsernameError(null)
			return
		}

		// Don't check if username hasn't changed
		if (username === originalUsernameRef.current) {
			setUsernameError(null)
			return
		}

		// Clear previous timeout
		if (usernameCheckTimeoutRef.current) {
			clearTimeout(usernameCheckTimeoutRef.current)
		}

		// Validate username format
		const usernameRegex = /^[a-zA-Z0-9_-]+$/
		if (!usernameRegex.test(username)) {
			setUsernameError("Username can only contain letters, numbers, underscores, and hyphens")
			return
		}

		if (username.length < 3) {
			setUsernameError("Username must be at least 3 characters")
			return
		}

		if (username.length > 50) {
			setUsernameError("Username must be less than 50 characters")
			return
		}

		// Debounce username check
		usernameCheckTimeoutRef.current = setTimeout(async () => {
			setIsCheckingUsername(true)
			setUsernameError(null)

			try {
				const response = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`)
				const result = await response.json()

				if (!result.success) {
					setUsernameError(result.message || "Error checking username")
				} else if (!result.data.available) {
					setUsernameError("Username is already taken")
				}
			} catch (error) {
				console.error("Error checking username:", error)
				setUsernameError("Error checking username availability")
			} finally {
				setIsCheckingUsername(false)
			}
		}, 500)

		return () => {
			if (usernameCheckTimeoutRef.current) {
				clearTimeout(usernameCheckTimeoutRef.current)
			}
		}
	}, [username])

	const fetchProfile = async () => {
		try {
			setLoading(true)
			const response = await fetch("/api/users/me")
			const data = await response.json()

			if (data.success && data.data) {
				const userData = data.data
				setUser(userData)
				setFirstName(userData.first_name || "")
				setLastName(userData.last_name || "")
				setUsername(userData.username || "")
				setAvatarUrl(userData.avatar_url || "")
				originalUsernameRef.current = userData.username || ""
			} else {
				setError("Failed to load profile")
			}
		} catch (error) {
			console.error("Error fetching profile:", error)
			setError("Failed to load profile")
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setSuccess(null)

		if (!firstName.trim() || !lastName.trim() || !username.trim()) {
			setError("First name, last name, and username are required")
			return
		}

		if (usernameError || isCheckingUsername) {
			setError("Please fix username errors before saving")
			return
		}

		setSaving(true)

		try {
			const response = await fetch("/api/users/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					first_name: firstName.trim(),
					last_name: lastName.trim(),
					username: username.trim(),
					avatar_url: avatarUrl.trim() || undefined,
				}),
			})

			const result = await response.json()

			if (!result.success) {
				setError(result.message || "Failed to update profile")
			} else {
				setSuccess("Profile updated successfully!")
				originalUsernameRef.current = username.trim()
				// Refresh user data
				await fetchProfile()
				setTimeout(() => setSuccess(null), 3000)
			}
		} catch (error) {
			console.error("Error updating profile:", error)
			setError("An unexpected error occurred")
		} finally {
			setSaving(false)
		}
	}

	if (authLoading || loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		)
	}

	if (!authUser || !user) {
		return null // Will redirect
	}

	const isFormValid = firstName.trim() && lastName.trim() && username.trim() && !usernameError && !isCheckingUsername

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-2xl mx-auto">
				<div className="mb-6">
					<Link
						href="/dashboard"
						className="text-blue-600 hover:text-blue-700 text-sm font-medium"
					>
						← Back to Dashboard
					</Link>
				</div>

				<div className="bg-white rounded-lg shadow-sm p-8">
					<h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

					{error && (
						<div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
							<div className="text-sm text-red-600">{error}</div>
						</div>
					)}

					{success && (
						<div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
							<div className="text-sm text-green-600">{success}</div>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
								Email
							</label>
							<input
								id="email"
								type="email"
								value={user.email}
								disabled
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
							/>
							<p className="mt-1 text-sm text-gray-600">Email cannot be changed</p>
						</div>

						<div>
							<label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
								First Name <span className="text-red-500">*</span>
							</label>
							<input
								id="firstName"
								type="text"
								required
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								placeholder="John"
							/>
						</div>

						<div>
							<label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
								Last Name <span className="text-red-500">*</span>
							</label>
							<input
								id="lastName"
								type="text"
								required
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								placeholder="Doe"
							/>
						</div>

						<div>
							<label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
								Username <span className="text-red-500">*</span>
							</label>
							<input
								id="username"
								type="text"
								required
								value={username}
								onChange={(e) => setUsername(e.target.value.toLowerCase())}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								placeholder="johndoe"
							/>
							{isCheckingUsername && (
								<p className="mt-1 text-sm text-gray-600">Checking availability...</p>
							)}
							{usernameError && (
								<p className="mt-1 text-sm text-red-600">{usernameError}</p>
							)}
							{!usernameError && username.trim().length > 0 && !isCheckingUsername && username !== originalUsernameRef.current && (
								<p className="mt-1 text-sm text-green-600">✓ Username available</p>
							)}
							{username === originalUsernameRef.current && username.trim().length > 0 && (
								<p className="mt-1 text-sm text-gray-600">Current username</p>
							)}
						</div>

						<div>
							<label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-1">
								Avatar URL (optional)
							</label>
							<input
								id="avatarUrl"
								type="url"
								value={avatarUrl}
								onChange={(e) => setAvatarUrl(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								placeholder="https://example.com/avatar.jpg"
							/>
							<p className="mt-1 text-sm text-gray-600">Add a profile picture URL (optional)</p>
						</div>

						<div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
							<Link
								href="/dashboard"
								className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Cancel
							</Link>
							<button
								type="submit"
								disabled={!isFormValid || saving}
								className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{saving ? "Saving..." : "Save Changes"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

