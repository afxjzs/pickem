"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileStep } from "./ProfileStep"
import { PaymentStep } from "./PaymentStep"

type Step = "profile" | "payment"

export function OnboardingWizard() {
	const [currentStep, setCurrentStep] = useState<Step>("profile")
	const [profileData, setProfileData] = useState<{
		firstName: string
		lastName: string
		username: string
		avatarUrl?: string
	} | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const router = useRouter()

	const handleProfileNext = (data: {
		firstName: string
		lastName: string
		username: string
		avatarUrl?: string
	}) => {
		setProfileData(data)
		setCurrentStep("payment")
	}

	const handlePaymentSkip = async () => {
		await completeOnboarding()
	}

	const handlePaymentComplete = async () => {
		await completeOnboarding()
	}

	const completeOnboarding = async () => {
		if (!profileData) {
			setError("Profile data is missing")
			return
		}

		setIsSubmitting(true)
		setError(null)

		try {
			const response = await fetch("/api/users/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					first_name: profileData.firstName,
					last_name: profileData.lastName,
					username: profileData.username,
					avatar_url: profileData.avatarUrl,
				}),
			})

			const result = await response.json()

			if (!result.success) {
				setError(result.message || "Failed to complete onboarding")
				return
			}

			// Redirect to dashboard
			router.push("/dashboard")
		} catch (error) {
			console.error("Error completing onboarding:", error)
			setError("An unexpected error occurred")
		} finally {
			setIsSubmitting(false)
		}
	}

	const steps: { key: Step; label: string }[] = [
		{ key: "profile", label: "Profile" },
		{ key: "payment", label: "Payment" },
	]

	const currentStepIndex = steps.findIndex((s) => s.key === currentStep)

	return (
		<div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#4580BC' }}>
			<div className="max-w-2xl mx-auto">
				{/* Progress indicator */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-2">
						{steps.map((step, index) => (
							<React.Fragment key={step.key}>
								<div className="flex items-center">
									<div
										className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
											index <= currentStepIndex
												? "bg-[#4580BC] border-[#4580BC] text-white"
												: "border-white/50 text-white/70 bg-white/10"
										}`}
									>
										{index < currentStepIndex ? (
											<svg
												className="w-5 h-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
										) : (
											index + 1
										)}
									</div>
									<span
										className={`ml-2 text-sm font-medium ${
											index <= currentStepIndex ? "text-white" : "text-white/70"
										}`}
									>
										{step.label}
									</span>
								</div>
								{index < steps.length - 1 && (
									<div
										className={`flex-1 h-0.5 mx-4 ${
											index < currentStepIndex ? "bg-white" : "bg-white/30"
										}`}
									/>
								)}
							</React.Fragment>
						))}
					</div>
				</div>

				{/* Step content */}
				<div className="bg-white rounded-lg shadow-lg p-8">
					{error && (
						<div className="mb-6 bg-[#EF4444]/10 border-2 border-[#EF4444] rounded-md p-4">
							<div className="text-sm text-[#EF4444]">{error}</div>
						</div>
					)}

					{currentStep === "profile" && (
						<ProfileStep onNext={handleProfileNext} initialData={profileData || undefined} />
					)}

					{currentStep === "payment" && (
						<PaymentStep
							onSkip={handlePaymentSkip}
							onComplete={handlePaymentComplete}
						/>
					)}

					{isSubmitting && (
						<div className="mt-4 text-center text-sm text-gray-600">
							Completing setup...
						</div>
					)}
				</div>
			</div>
		</div>
	)
}



