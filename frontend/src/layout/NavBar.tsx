import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, UserPlus, UserMinus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'General', href: '/dashboard', search: '?tab=general', icon: LayoutGrid },
    { name: 'Onboarding', href: '/dashboard', search: '?tab=onboarding', icon: UserPlus },
    { name: 'Exit Interview', href: '/dashboard', search: '?tab=exit-interview', icon: UserMinus },
];

export const NavBar: React.FC = () => {
    const location = useLocation();
    const currentTab = new URLSearchParams(location.search).get('tab') || 'general';

    const activeItem = navItems.find(item =>
        item.search.includes(`tab=${currentTab}`)
    ) || navItems[0];

    const [hoveredTab, setHoveredTab] = useState<string | null>(null);

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="
                flex items-center gap-2 p-2 
                rounded-full 
                bg-background/60 backdrop-blur-xl border border-white/10
                shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]
                dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]
            ">
                {navItems.map((item) => {
                    const isActive = item.name === activeItem.name;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={`${item.href}${item.search}`}
                            className={cn(
                                "relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out flex items-center gap-2",
                                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            onMouseEnter={() => setHoveredTab(item.name)}
                            onMouseLeave={() => setHoveredTab(null)}
                        >
                            {/* Active/Hover Background - The "Liquid" Part */}
                            {isActive && (
                                <motion.div
                                    layoutId="nav-pill"
                                    className="absolute inset-0 bg-primary rounded-full -z-10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            {/* Hover Effect for non-active items */}
                            {!isActive && hoveredTab === item.name && (
                                <motion.div
                                    layoutId="nav-hover"
                                    className="absolute inset-0 bg-secondary/50 rounded-full -z-10"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}

                            <Icon className="w-4 h-4 z-10 relative" />
                            <span className="z-10 relative">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};
