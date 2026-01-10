import React from 'react';
import ReactDOM from 'react-dom/client';
import { Dashboard } from './pages/TurnoverDashboard';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Dashboard mode="production" />
    </React.StrictMode>,
);
