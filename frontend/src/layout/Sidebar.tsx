import React from 'react';
import { Home, User, Users, Settings, LayoutDashboard, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path: string) => {
        return currentPath === path;
    };

    return (
        <div className="w-64 h-screen bg-background border-r flex flex-col p-6 fixed left-0 top-0 z-50">
            <div className="mb-12 px-2">
                <Link to="/">
                    <h2 className="text-xl font-bold text-foreground">People Analytics</h2>
                </Link>
            </div>

            <div className="flex flex-col gap-2">
                <nav className="grid gap-1">
                    <Link
                        to="/"
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            isActive('/')
                                ? "bg-secondary text-primary"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                    <Link
                        to="/dashboard"
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
                        to="/individual"
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
                        to="/aggregate"
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
                        to="/motivation"
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
                </nav>
            </div>

            <div className="mt-auto">
                <Link to="/settings">
                    <Button variant="outline" className={cn("w-full justify-start gap-2", isActive('/settings') && "bg-secondary text-primary border-primary/20")}>
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                </Link>
            </div>
        </div>
    );
};
