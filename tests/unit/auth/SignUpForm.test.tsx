import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SignUpForm } from "@/components/auth/SignUpForm"

// Mock next/navigation
const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}))

// Mock the auth context
const mockSignUp = jest.fn()
const mockUseAuth = jest.fn()

jest.mock("@/lib/contexts/AuthContext", () => ({
	useAuth: () => mockUseAuth(),
}))

describe("SignUpForm", () => {
	beforeEach(() => {
		jest.clearAllMocks()
		mockUseAuth.mockReturnValue({
			signUp: mockSignUp,
			loading: false,
			user: null,
		})
	})

	it("should render sign up form with email and password fields", () => {
		render(<SignUpForm />)

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
		expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument()
	})

	it("should handle form submission with valid credentials", async () => {
		mockSignUp.mockResolvedValue({ error: null })

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole("button", { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: "test@example.com" } })
		fireEvent.change(passwordInput, { target: { value: "password123" } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "password123")
		})

		// Should show success message
		expect(
			screen.getByText(
				"Account created successfully! Redirecting to dashboard..."
			)
		).toBeInTheDocument()
		// Should redirect after delay (we'll test this with a timer mock if needed)
	})

	it("should display error message when sign up fails with user validation error", async () => {
		mockSignUp.mockResolvedValue({ error: "Email already exists" })

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole("button", { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: "existing@example.com" } })
		fireEvent.change(passwordInput, { target: { value: "password123" } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith(
				"existing@example.com",
				"password123"
			)
		})

		// Should show error message
		expect(screen.getByText("Email already exists")).toBeInTheDocument()
		// Should not redirect on error
		expect(mockPush).not.toHaveBeenCalled()
	})

	it("should display error message when sign up fails with password validation error", async () => {
		mockSignUp.mockResolvedValue({
			error: "Password should be at least 6 characters",
		})

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole("button", { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: "test@example.com" } })
		fireEvent.change(passwordInput, { target: { value: "123" } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "123")
		})

		// Should show error message
		expect(
			screen.getByText("Password should be at least 6 characters")
		).toBeInTheDocument()
		// Should not redirect on error
		expect(mockPush).not.toHaveBeenCalled()
	})

	it("should disable form submission while loading", () => {
		mockUseAuth.mockReturnValue({
			signUp: mockSignUp,
			loading: true,
			user: null,
		})

		render(<SignUpForm />)

		const submitButton = screen.getByRole("button", { name: /sign up/i })
		expect(submitButton).toBeDisabled()
	})

	it("should redirect to dashboard if already signed in", () => {
		mockUseAuth.mockReturnValue({
			signUp: mockSignUp,
			loading: false,
			user: { email: "test@example.com" },
		})

		render(<SignUpForm />)

		// Should redirect immediately
		expect(mockPush).toHaveBeenCalledWith("/dashboard")
	})

	it("should not log user validation errors to console", async () => {
		const consoleSpy = jest.spyOn(console, "error").mockImplementation()
		mockSignUp.mockResolvedValue({
			error: "Password should be at least 6 characters",
		})

		render(<SignUpForm />)

		const emailInput = screen.getByLabelText(/email/i)
		const passwordInput = screen.getByLabelText(/password/i)
		const submitButton = screen.getByRole("button", { name: /sign up/i })

		fireEvent.change(emailInput, { target: { value: "test@example.com" } })
		fireEvent.change(passwordInput, { target: { value: "123" } })
		fireEvent.click(submitButton)

		await waitFor(() => {
			expect(mockSignUp).toHaveBeenCalledWith("test@example.com", "123")
		})

		// Should show error message
		expect(
			screen.getByText("Password should be at least 6 characters")
		).toBeInTheDocument()
		// Should NOT log user validation errors to console
		expect(consoleSpy).not.toHaveBeenCalled()

		consoleSpy.mockRestore()
	})
})
