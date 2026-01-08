/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 */
import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
    children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Authenticating...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        // Redirect to login, preserving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <>{children}</>
}
