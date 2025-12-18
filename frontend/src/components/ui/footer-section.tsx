'use client';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FacebookIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from 'lucide-react';
import { TurnoverLogo } from "@/components/ui/turnover-logo";

interface FooterLink {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
    label: string;
    links: FooterLink[];
}

const footerLinks: FooterSection[] = [
    {
        label: 'Product',
        links: [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Feature Importance', href: '/dashboard' },
            { title: 'Cohort Analysis', href: '/aggregate' },
            { title: 'Individual Risk', href: '/individual' },
        ],
    },
    {
        label: 'Company',
        links: [
            { title: 'About Us', href: '#' },
            { title: 'Methodology', href: '#' },
            { title: 'Privacy Policy', href: '#' },
            { title: 'Terms', href: '#' },
        ],
    },
    {
        label: 'Resources',
        links: [
            { title: 'Documentation', href: '#' },
            { title: 'API Reference', href: '#' },
            { title: 'Support', href: '#' },
        ],
    },
    {
        label: 'Connect',
        links: [
            { title: 'LinkedIn', href: '#', icon: LinkedinIcon },
            { title: 'Twitter', href: '#', icon: FacebookIcon }, // Placeholder icon
            { title: 'YouTube', href: '#', icon: YoutubeIcon },
        ],
    },
];

import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="relative w-full z-10 bg-background border-t pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
                    <AnimatedContainer className="space-y-4">
                        <div className="flex items-center gap-4">
                            <TurnoverLogo className="w-12 h-8 flex items-center justify-center -translate-y-1" scale={0.15} animate={false} />
                            <span className="text-xl font-bold tracking-tight">TurnoverAI</span>
                        </div>
                        <p className="text-muted-foreground mt-4 text-sm max-w-xs">
                            Advanced people analytics platform for predicting and preventing employee turnover.
                        </p>
                        <p className="text-muted-foreground text-xs mt-8">
                            © {new Date().getFullYear()} TurnoverAI. All rights reserved.
                        </p>
                    </AnimatedContainer>

                    <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
                        {footerLinks.map((section, index) => (
                            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
                                <div className="mb-10 md:mb-0">
                                    <h3 className="text-sm font-semibold">{section.label}</h3>
                                    <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                                        {section.links.map((link) => (
                                            <li key={link.title}>
                                                <Link
                                                    to={link.href}
                                                    className="hover:text-primary inline-flex items-center transition-all duration-300"
                                                >
                                                    {link.icon && <link.icon className="me-2 size-4" />}
                                                    {link.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </AnimatedContainer>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

type ViewAnimationProps = {
    delay?: number;
    className?: ComponentProps<typeof motion.div>['className'];
    children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
    const shouldReduceMotion = useReducedMotion();

    if (shouldReduceMotion) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
            whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.8 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
