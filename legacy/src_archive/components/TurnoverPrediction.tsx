import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'motion/react';

interface TurnoverData {
  month: string;
  predicted_turnover: number;
  historical_turnover: number;
  confidence_lower: number;
  confidence_upper: number;
}

interface TurnoverPredictionProps {
  data: TurnoverData[];
}

export function TurnoverPrediction({ data }: TurnoverPredictionProps) {
  const latestPrediction = data[data.length - 1]?.predicted_turnover || 0;
  const avgHistorical = data.reduce((acc, d) => acc + d.historical_turnover, 0) / data.length;
  const variation = latestPrediction - data[0]?.historical_turnover || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-3xl p-12 border border-gray-100"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}
    >
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 40, left: 20, bottom: 40 }}>
          <defs>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#667eea" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'Período',
              position: 'bottom',
              offset: 0,
              style: { fill: '#718096', fontSize: 13, fontWeight: 300 }
            }}
          />
          <YAxis
            tick={{ fill: '#a0aec0', fontSize: 12, fontWeight: 300 }}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{
              value: 'Taxa de Turnover (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fill: '#718096', fontSize: 13, fontWeight: 300 }
            }}
            domain={[0, 'auto']}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-xl border border-gray-100"
                    style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}
                  >
                    <p style={{ fontSize: '0.875rem', fontWeight: 400, color: '#2d3748', marginBottom: '0.75rem' }}>
                      {label}
                    </p>
                    {payload.map((entry, index) => {
                      if (entry.dataKey === 'predicted_turnover' || entry.dataKey === 'historical_turnover') {
                        return (
                          <p key={index} style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '0.25rem' }}>
                            {entry.name}: <span style={{ fontWeight: 500, color: entry.color }}>
                              {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
                            </span>
                          </p>
                        );
                      }
                      return null;
                    })}
                  </motion.div>
                );
              }
              return null;
            }}
            cursor={{ stroke: '#cbd5e0', strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="confidence_upper"
            stroke="transparent"
            fill="url(#colorConfidence)"
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="confidence_lower"
            stroke="transparent"
            fill="url(#colorConfidence)"
            strokeWidth={0}
          />
          <Line
            type="monotone"
            dataKey="historical_turnover"
            stroke="#cbd5e0"
            strokeWidth={2}
            dot={{ r: 3, fill: '#cbd5e0', strokeWidth: 0 }}
            name="Histórico"
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="predicted_turnover"
            stroke="#667eea"
            strokeWidth={3}
            dot={{ r: 4, fill: '#667eea', strokeWidth: 0 }}
            name="Predição"
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' }}
        >
          <p style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 300, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Tendência Atual
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 300, color: '#667eea' }}>
            {latestPrediction.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6"
          style={{ background: 'rgba(203, 213, 224, 0.15)' }}
        >
          <p style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 300, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Média Histórica
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 300, color: '#4a5568' }}>
            {avgHistorical.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{ background: variation >= 0 ? 'rgba(245, 101, 101, 0.1)' : 'rgba(72, 187, 120, 0.1)' }}
        >
          <p style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 300, marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Variação
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 300, color: variation >= 0 ? '#f56565' : '#48bb78' }}>
            {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
