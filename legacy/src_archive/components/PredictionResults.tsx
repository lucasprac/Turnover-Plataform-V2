import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { motion } from 'motion/react';

interface Prediction {
  employee_id: string;
  predicted_value: number;
  actual_value?: number;
  confidence: number;
  risk_level: 'low' | 'medium' | 'high';
}

interface PredictionResultsProps {
  predictions: Prediction[];
}

export function PredictionResults({ predictions }: PredictionResultsProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#f56565';
      case 'medium': return '#ed8936';
      case 'low': return '#48bb78';
      default: return '#cbd5e0';
    }
  };

  const scatterData = predictions.map(p => ({
    x: p.predicted_value,
    y: p.confidence,
    z: 100,
    risk: p.risk_level,
    id: p.employee_id
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-3xl p-12 border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}
    >
      <ResponsiveContainer width="100%" height={450}>
        <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            dataKey="x"
            name="Valor Predito"
            domain={[0, 1]}
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'Probabilidade de Saída',
              position: 'bottom',
              offset: 0,
              style: { fill: '#718096', fontSize: 13, fontWeight: 300 }
            }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Confiança"
            domain={[0, 1]}
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'Confiança do Modelo',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#718096', fontSize: 13, fontWeight: 300 }
            }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <ZAxis type="number" dataKey="z" range={[80, 300]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e0' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl border border-gray-100"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#2d3748', marginBottom: '0.75rem' }}>
                      Funcionário {data.id}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Probabilidade: <span style={{ fontWeight: 500, color: '#2d3748' }}>
                        {(data.x * 100).toFixed(1)}%
                      </span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      Confiança: <span style={{ fontWeight: 500, color: '#2d3748' }}>
                        {(data.y * 100).toFixed(1)}%
                      </span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096' }}>
                      Risco: <span style={{
                        fontWeight: 500,
                        color: data.risk === 'high' ? '#f56565' :
                               data.risk === 'medium' ? '#ed8936' : '#48bb78'
                      }}>
                        {data.risk === 'high' ? 'Alto' : data.risk === 'medium' ? 'Médio' : 'Baixo'}
                      </span>
                    </p>
                  </motion.div>
                );
              }
              return null;
            }}
          />
          <Scatter data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getRiskColor(entry.risk)}
                fillOpacity={0.7}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-8 mt-8 justify-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: '#f56565' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 300 }}>Alto Risco</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ed8936' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 300 }}>Médio Risco</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: '#48bb78' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 300 }}>Baixo Risco</span>
        </div>
      </div>
    </motion.div>
  );
}
