import { AuthProvider } from '@/lib/contexts/AuthContext'

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return <AuthProvider>{children}</AuthProvider>
}
