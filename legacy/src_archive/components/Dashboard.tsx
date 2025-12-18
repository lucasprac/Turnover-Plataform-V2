import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, RefreshCw } from 'lucide-react';
import { ShapChart } from './ShapChart';
import { FeatureImportance } from './FeatureImportance';
import { PredictionResults } from './PredictionResults';
import { MetricsOverview } from './MetricsOverview';
import { TurnoverPrediction } from './TurnoverPrediction';
import { getMockData } from '../utils/mockData';

interface DashboardProps {
  apiEndpoint: string;
  apiKey: string;
  onReconfigure: () => void;
}

export function Dashboard({ apiEndpoint, apiKey, onReconfigure }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Falha na requisição');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.log('Usando dados demo:', err);
      setData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-purple-100 border-t-purple-500"
          ></motion.div>
          <p style={{ color: '#718096', fontSize: '1rem', fontWeight: 300 }}>Carregando análises...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 300, color: '#2d3748', letterSpacing: '-0.025em' }}>
                People Analytics
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#a0aec0', fontWeight: 300, marginTop: '0.25rem' }}>
                Análise Preditiva com SHAP
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchData}
                className="p-3 rounded-full bg-purple-50 hover:bg-purple-100 transition-colors duration-300"
              >
                <RefreshCw className="w-5 h-5" style={{ color: '#805ad5' }} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReconfigure}
                className="p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors duration-300"
              >
                <Settings className="w-5 h-5" style={{ color: '#718096' }} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Métricas Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <MetricsOverview metrics={data.metrics} />
        </motion.div>

        {/* Section: SHAP Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-24"
        >
          <div className="mb-8">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#2d3748', marginBottom: '0.5rem' }}>
              SHAP Values
            </h2>
            <p style={{ fontSize: '1rem', color: '#a0aec0', fontWeight: 300 }}>
              Explicabilidade do modelo de machine learning
            </p>
          </div>
          <ShapChart data={data.shap_values} />
        </motion.div>

        {/* Section: Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-24"
        >
          <div className="mb-8">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#2d3748', marginBottom: '0.5rem' }}>
              Distribuição de Predições
            </h2>
            <p style={{ fontSize: '1rem', color: '#a0aec0', fontWeight: 300 }}>
              Análise de confiança e risco por funcionário
            </p>
          </div>
          <PredictionResults predictions={data.predictions} />
        </motion.div>

        {/* Section: Feature Importance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-24"
        >
          <div className="mb-8">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#2d3748', marginBottom: '0.5rem' }}>
              Feature Importance
            </h2>
            <p style={{ fontSize: '1rem', color: '#a0aec0', fontWeight: 300 }}>
              Importância relativa de cada variável
            </p>
          </div>
          <FeatureImportance data={data.feature_importance} />
        </motion.div>

        {/* Section: Turnover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <div className="mb-8">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#2d3748', marginBottom: '0.5rem' }}>
              Predição de Turnover
            </h2>
            <p style={{ fontSize: '1rem', color: '#a0aec0', fontWeight: 300 }}>
              Análise temporal com intervalos de confiança
            </p>
          </div>
          <TurnoverPrediction data={data.turnover_analysis} />
        </motion.div>
      </main>
    </div>
  );
}
