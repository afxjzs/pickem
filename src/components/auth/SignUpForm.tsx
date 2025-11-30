"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Single Responsibility Principle: This component only handles sign-up form logic
export function SignUpForm() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const { signUp, loading, user } = useAuth()
	const router = useRouter()

	// Redirect if already signed in
	useEffect(() => {
		if (user && !loading) {
			router.push("/onboarding")
		}
	}, [user, loading, router])

	// Helper function to determine if an error is a user validation error (not logged)
	const isUserValidationError = (error: string): boolean => {
		const userErrors = [
			'Password should be at least',
			'Email already exists',
			'Invalid email',
			'Password is too weak',
			'Email format is invalid'
		]
		return userErrors.some(userError => error.includes(userError))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsSubmitting(true)
		setError(null)
		setSuccess(null)

		try {
			const { error } = await signUp(email, password)
			if (error) {
				setError(error)
				// Only log application errors, not user validation errors
				if (!isUserValidationError(error)) {
					console.error("Sign up error:", error)
				}
			} else {
				setSuccess("Account created successfully! Redirecting to setup...")
				// Clear form
				setEmail("")
				setPassword("")
				// Wait for session to be established and cookies to be set
				// With email confirmation disabled, session should be available immediately
				// The auth state change listener will update the user state
				// Give it time to process and set cookies before redirecting
				setTimeout(() => {
					router.push("/onboarding")
				}, 1500)
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unexpected error occurred"
			setError(errorMessage)
			// Always log unexpected errors as they indicate application issues
			console.error("Unexpected error:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const isFormDisabled = loading || isSubmitting

	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#4580BC' }}>
			<div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-lg p-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-galindo text-[#265387]">
						Create your account
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						Or{" "}
						<Link
							href="/signin"
							className="font-medium text-[#4580BC] hover:text-[#265387]"
						>
							sign in to your existing account
						</Link>
					</p>
				</div>

				{error && (
					<div className="bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-md p-4">
						<div className="text-sm text-[#EF4444]">{error}</div>
					</div>
				)}

				{success && (
					<div className="bg-[#10B981]/10 border-2 border-[#10B981] rounded-md p-4">
						<div className="text-sm text-[#10B981]">{success}</div>
					</div>
				)}

				<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC] focus:z-10 sm:text-sm"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={isFormDisabled}
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#4580BC] focus:border-[#4580BC] focus:z-10 sm:text-sm"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={isFormDisabled}
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={isFormDisabled}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#4580BC] hover:bg-[#265387] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4580BC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isSubmitting ? "Creating account..." : "Sign up"}
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}
