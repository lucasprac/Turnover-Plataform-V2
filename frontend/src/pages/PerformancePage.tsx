import React from 'react';
import { Sidebar } from '@/layout/Sidebar';
import PerformanceDashboard from '@/features/performance/PerformanceDashboard';

interface PerformancePageProps {
    mode?: 'demo' | 'production';
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ mode = 'demo' }) => {
    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64">
                <PerformanceDashboard mode={mode} />
            </main>
        </div>
    );
};
