import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { ApiConfig } from './components/ApiConfig';

export default function App() {
  const [apiEndpoint, setApiEndpoint] = useState('https://sua-api.com/predict');
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  const handleConfigure = (endpoint: string, key: string) => {
    setApiEndpoint(endpoint);
    setApiKey(key);
    setIsConfigured(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {!isConfigured ? (
        <ApiConfig onConfigure={handleConfigure} />
      ) : (
        <Dashboard apiEndpoint={apiEndpoint} apiKey={apiKey} onReconfigure={() => setIsConfigured(false)} />
      )}
    </div>
  );
}
