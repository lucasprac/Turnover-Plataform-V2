import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import { Dashboard } from './pages/TurnoverDashboard';
import { IndividualPage } from './pages/IndividualPage';
import { AggregatePage } from './pages/AggregatePage';
import { SettingsPage } from './pages/SettingsPage';
import { MotivationPage } from './pages/MotivationPage';
import { PerformancePage } from './pages/PerformancePage';
import { BayesianAnalysisPage } from './pages/BayesianAnalysisPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './components/AuthProvider';

/**
 * App Component
 * 
 * Dual-mode application:
 * - /demo/* : Demo routes using synthetic data (no auth required)
 * - /app/*  : Production routes using real data (auth required)
 */
export default function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-background font-sans text-foreground">
                <Routes>
                    {/* ============================================= */}
                    {/* Public Routes */}
                    {/* ============================================= */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* ============================================= */}
                    {/* Protected Routes */}
                    {/* ============================================= */}
                    <Route element={<ProtectedRoute />}>
                        {/* Demo Routes - Now Protected */}
                        <Route path="/demo/dashboard" element={<Dashboard mode="demo" />} />
                        <Route path="/demo/individual" element={<IndividualPage mode="demo" />} />
                        <Route path="/demo/aggregate" element={<AggregatePage mode="demo" />} />
                        <Route path="/demo/motivation" element={<MotivationPage mode="demo" />} />
                        <Route path="/demo/performance" element={<PerformancePage mode="demo" />} />
                        <Route path="/demo/bayesian-analysis" element={<BayesianAnalysisPage mode="demo" />} />

                        {/* Production Routes */}
                        <Route path="/app">
                            <Route path="dashboard" element={<Dashboard mode="production" />} />
                            <Route path="individual" element={<IndividualPage mode="production" />} />
                            <Route path="aggregate" element={<AggregatePage mode="production" />} />
                            <Route path="motivation" element={<MotivationPage mode="production" />} />
                            <Route path="performance" element={<PerformancePage mode="production" />} />
                            <Route path="bayesian-analysis" element={<BayesianAnalysisPage mode="production" />} />
                            <Route path="settings" element={<SettingsPage />} />
                        </Route>

                        {/* Legacy routes */}
                        <Route path="/dashboard" element={<Dashboard mode="demo" />} />
                        <Route path="/individual" element={<IndividualPage mode="demo" />} />
                        <Route path="/aggregate" element={<AggregatePage mode="demo" />} />
                    </Route>
                </Routes>
            </div>
        </AuthProvider>
    );
}
