import { motion } from 'motion/react';

interface Metrics {
  model_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_predictions: number;
  high_risk_count: number;
}

interface MetricsOverviewProps {
  metrics: Metrics;
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  const cards = [
    {
      title: 'Acurácia',
      value: `${(metrics.model_accuracy * 100).toFixed(1)}%`,
      color: '#667eea',
    },
    {
      title: 'Precisão',
      value: `${(metrics.precision * 100).toFixed(1)}%`,
      color: '#48bb78',
    },
    {
      title: 'Recall',
      value: `${(metrics.recall * 100).toFixed(1)}%`,
      color: '#9f7aea',
    },
    {
      title: 'F1-Score',
      value: `${(metrics.f1_score * 100).toFixed(1)}%`,
      color: '#ed8936',
    },
    {
      title: 'Total de Predições',
      value: metrics.total_predictions.toString(),
      color: '#4299e1',
    },
    {
      title: 'Alto Risco',
      value: metrics.high_risk_count.toString(),
      color: '#f56565',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl p-8 border border-gray-100"
          style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <p style={{ fontSize: '0.875rem', color: '#a0aec0', fontWeight: 300, marginBottom: '0.75rem' }}>
                {card.title}
              </p>
              <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#2d3748', lineHeight: 1 }}>
                {card.value}
              </p>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: card.color, marginTop: '0.5rem' }}
            ></div>
          </div>
          <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
              className="h-full rounded-full"
              style={{ background: card.color, opacity: 0.3 }}
            ></motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
