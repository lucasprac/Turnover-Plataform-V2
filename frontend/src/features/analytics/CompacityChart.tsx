import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CompacityChartProps {
    data: {
        feature_importance: { feature: string; importance: number }[];
    };
    targetAccuracy?: number;
}

export function CompacityChart({ data, targetAccuracy = 0.85 }: CompacityChartProps) {
    const sortedFeatures = [...data.feature_importance].sort((a, b) => b.importance - a.importance);
    const totalImportance = sortedFeatures.reduce((sum, f) => sum + f.importance, 0);

    let cumulative = 0;
    const chartData = sortedFeatures.map((f, index) => {
        cumulative += f.importance;
        const cumulativePct = totalImportance > 0 ? (cumulative / totalImportance) * 100 : 0;
        return {
            index: index + 1,
            feature: f.feature,
            cumulativePct,
            individualPct: (f.importance / totalImportance) * 100
        };
    });

    const targetPct = targetAccuracy * 100;
    const featuresNeeded = chartData.findIndex(d => d.cumulativePct >= targetPct) + 1 || chartData.length;
    const displayData = chartData.slice(0, 12);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* Key insight */}
            <div className="mb-6 flex items-baseline gap-2">
                <span
                    className="text-5xl font-bold tracking-tighter"
                    style={{ color: 'hsl(var(--color-green))' }}
                >
                    {featuresNeeded}
                </span>
                <div>
                    <p className="text-[10px] uppercase font-bold text-foreground">features needed</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{(targetAccuracy * 100).toFixed(0)}% accuracy</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--color-green))" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="hsl(var(--color-green))" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="feature"
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            hide
                        />

                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}%`}
                            width={35}
                        />

                        <ReferenceLine
                            y={targetPct}
                            stroke="hsl(var(--color-orange))"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                        />

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload[0]) {
                                    const item = payload[0].payload;
                                    return (
                                        <div className="bg-white border border-border px-3 py-2 shadow-lg rounded">
                                            <p className="font-bold text-[10px] text-foreground">{item.feature}</p>
                                            <p className="text-[9px] text-muted-foreground mt-0.5 uppercase">
                                                Cumulative: {item.cumulativePct.toFixed(1)}%
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="cumulativePct"
                            stroke="hsl(var(--color-green))"
                            strokeWidth={1.5}
                            fill="url(#areaGradient)"
                            dot={{ fill: 'hsl(var(--color-green))', strokeWidth: 0, r: 2 }}
                            activeDot={{ r: 4, fill: 'hsl(var(--color-green))' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Essential features tags */}
            <div className="mt-6 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-1.5">
                    {chartData.slice(0, featuresNeeded).map((item, idx) => (
                        <motion.span
                            key={item.feature}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + idx * 0.03 }}
                            className="px-2 py-1 text-[9px] uppercase font-bold rounded border border-border bg-background text-foreground"
                        >
                            {item.feature}
                        </motion.span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default CompacityChart;
