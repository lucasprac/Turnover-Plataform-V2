import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './pages/TurnoverDashboard';
import './global.css';

// Hardcoded endpoint for the internal application
const apiEndpoint = '/api/dashboard-data';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Dashboard apiEndpoint={apiEndpoint} />
    </React.StrictMode>,
);
