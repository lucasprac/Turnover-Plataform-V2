import React from 'react';
import { Sidebar } from '@/layout/Sidebar';
import PerformanceDashboard from '@/features/performance/PerformanceDashboard';

export const PerformancePage: React.FC = () => {
    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64">
                <PerformanceDashboard />
            </main>
        </div>
    );
};
