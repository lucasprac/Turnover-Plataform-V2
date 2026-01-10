/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Uses Outlet for nested route rendering.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Verificando autenticacao...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login, preserving the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Render nested routes via Outlet
    return <Outlet />;
}
