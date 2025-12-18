import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

interface FeatureImportanceProps {
  data: Array<{ feature: string; importance: number }>;
}

export function FeatureImportance({ data }: FeatureImportanceProps) {
  const sortedData = [...data].sort((a, b) => b.importance - a.importance);

  // Gradient colors for bars
  const getBarColor = (index: number, total: number) => {
    const ratio = index / total;
    const hue = 250 - ratio * 60; // From purple to blue
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-3xl p-12 border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}
    >
      <ResponsiveContainer width="100%" height={450}>
        <BarChart
          data={sortedData}
          margin={{ top: 5, right: 40, left: 120, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={[0, 1]}
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <YAxis
            dataKey="feature"
            type="category"
            tick={{ fill: '#4a5568', fontSize: 13, fontWeight: 400 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl border border-gray-100"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#2d3748', marginBottom: '0.5rem' }}>
                      {payload[0].payload.feature}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096' }}>
                      Importância: <span style={{ color: '#805ad5', fontWeight: 500 }}>
                        {((payload[0].value as number) * 100).toFixed(1)}%
                      </span>
                    </p>
                  </motion.div>
                );
              }
              return null;
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
          />
          <Bar dataKey="importance" radius={[0, 8, 8, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(index, sortedData.length)}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
