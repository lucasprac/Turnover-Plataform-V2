import React from 'react';
import { Home, User, Users, Settings, LayoutDashboard, Zap, Brain, Info, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const { user, signOut } = useAuth();

    // Determine current mode based on URL path
    const isDemo = currentPath.startsWith('/demo');
    const isApp = currentPath.startsWith('/app');
    const basePath = isApp ? '/app' : '/demo';

    const isActive = (subPath: string) => {
        return currentPath === `${basePath}${subPath}`;
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="w-64 h-screen bg-background border-r flex flex-col p-6 fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="mb-6 px-2">
                <Link to="/">
                    <h2 className="text-xl font-bold text-foreground">People Analytics</h2>
                </Link>
            </div>

            {/* Mode Banner */}
            {isDemo && (
                <div className="mb-6 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                        <Info className="w-4 h-4" />
                        <span className="text-xs font-medium">DEMO MODE</span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                        Using synthetic data.{' '}
                        <Link to="/login" className="underline hover:text-amber-800">
                            Sign in
                        </Link>{' '}
                        for real data.
                    </p>
                </div>
            )}

            {isApp && user && (
                <div className="mb-6 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 text-emerald-700">
                        <User className="w-4 h-4" />
                        <span className="text-xs font-medium truncate">{user.email}</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-1">Production Mode</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col gap-2 flex-1">
                <nav className="grid gap-1">
                    <Link
                        to="/"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            currentPath === '/'
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                    <Link
                        to={`${basePath}/dashboard`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/dashboard')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link
                        to={`${basePath}/individual`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/individual')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <User className="w-4 h-4" />
                        Individual Risk
                    </Link>
                    <Link
                        to={`${basePath}/aggregate`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/aggregate')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Group Forecast
                    </Link>
                    <Link
                        to={`${basePath}/motivation`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/motivation')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Motivation
                    </Link>
                    <Link
                        to={`${basePath}/performance`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/performance')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <Zap className="w-4 h-4" />
                        Performance
                    </Link>
                    <Link
                        to={`${basePath}/bayesian-analysis`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/bayesian-analysis')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <Brain className="w-4 h-4" />
                        Bayesian Analysis
                    </Link>
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto space-y-2">
                {isApp && (
                    <Link to="/app/settings">
                        <Button
                            variant="outline"
                            className={cn(
                                "w-full justify-start gap-2",
                                isActive('/settings') && "bg-secondary text-primary border-primary/20"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </Button>
                    </Link>
                )}

                {isApp && user && (
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                        onClick={handleSignOut}
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                )}
            </div>
        </div>
    );
};
