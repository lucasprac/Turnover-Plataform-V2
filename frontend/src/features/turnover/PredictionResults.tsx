import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts';
import { motion } from 'motion/react';

interface Prediction {
  id: string;
  employee_id?: string;
  name?: string;
  risk: number;
  predicted_value?: number;
  confidence?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

interface PredictionResultsProps {
  predictions: Prediction[];
}

export function PredictionResults({ predictions }: PredictionResultsProps) {
  // Normalize types if coming from different dashboard logic
  const normalizedData = predictions.map(p => ({
    x: p.predicted_value ?? p.risk,
    y: p.confidence ?? (0.8 + Math.random() * 0.15), // fallback if confidence not provided
    z: 100,
    risk: p.risk_level ?? (p.risk > 0.75 ? 'high' : p.risk > 0.4 ? 'medium' : 'low'),
    id: p.employee_id ?? p.id,
    name: p.name ?? `Employee ${p.id}`
  }));

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'hsl(var(--color-red))';
      case 'medium': return 'hsl(var(--color-orange))';
      case 'low': return 'hsl(var(--color-green))';
      default: return 'hsl(var(--muted))';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full min-h-[350px]"
    >
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            name="Risk"
            domain={[0, 1]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Confidence"
            domain={[0.7, 1]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <ZAxis type="number" dataKey="z" range={[80, 200]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'hsl(var(--muted-foreground))' }}
            content={({ active, payload }) => {
              if (active && payload && payload[0]) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded-lg border border-border shadow-xl">
                    <p className="text-xs font-bold text-foreground mb-1">
                      {data.name} ({data.id})
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Probability: <span className="text-foreground font-mono">{(data.x * 100).toFixed(1)}%</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Level: <span className="text-foreground font-bold uppercase tracking-tighter">{data.risk}</span>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter data={normalizedData}>
            {normalizedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getRiskColor(entry.risk)}
                fillOpacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-6 mt-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--color-red))' }}></div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--color-orange))' }}></div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--color-green))' }}></div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">Low Risk</span>
        </div>
      </div>
    </motion.div>
  );
}
