import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/TurnoverDashboard';
import { IndividualPage } from './pages/IndividualPage';
import { AggregatePage } from './pages/AggregatePage';
import { SettingsPage } from './pages/SettingsPage';
import { MotivationPage } from './pages/MotivationPage';

export default function App() {
    // Hardcoded endpoint for the internal application
    const apiEndpoint = '/api/dashboard-data';

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<Dashboard apiEndpoint={apiEndpoint} />} />
                <Route path="/individual" element={<IndividualPage />} />
                <Route path="/aggregate" element={<AggregatePage />} />
                <Route path="/motivation" element={<MotivationPage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </div>
    );
}
