import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

interface ShapValue {
  feature: string;
  value: number;
  base_value?: number;
  formatted_value?: string;
}

interface ShapChartProps {
  data: ShapValue[];
}

export function ShapChart({ data }: ShapChartProps) {
  const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-3xl p-12 border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}
    >
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 180, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
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
                const data = payload[0].payload;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl border border-gray-100"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#2d3748', marginBottom: '0.5rem' }}>
                      {data.feature}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                      SHAP Value: <span style={{ color: data.value > 0 ? '#48bb78' : '#f56565', fontWeight: 500 }}>
                        {data.value.toFixed(3)}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#718096' }}>
                      Base: {data.base_value.toFixed(3)}
                    </p>
                  </motion.div>
                );
              }
              return null;
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value > 0 ? '#48bb78' : '#f56565'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-8 mt-8 justify-center">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: '#48bb78' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 300 }}>Impacto Positivo</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ background: '#f56565' }}></div>
          <span style={{ fontSize: '0.875rem', color: '#718096', fontWeight: 300 }}>Impacto Negativo</span>
        </div>
      </div>
    </motion.div>
  );
}
