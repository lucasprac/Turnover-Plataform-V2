import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';

interface Contribution {
    feature: string;
    value: number;
    base_value?: number;
}

interface ContributionChartProps {
    data: Contribution[];
}

export function ContributionChart({ data }: ContributionChartProps) {
    // Sort by absolute value for clarity, but keep sign for coloring
    const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full min-h-[350px]"
        >
            <ResponsiveContainer width="100%" height={350}>
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        type="number"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                    />
                    <YAxis
                        dataKey="feature"
                        type="category"
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                        width={120}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted) / 0.1)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                                const item = payload[0].payload;
                                return (
                                    <div className="bg-white border border-border p-3 shadow-xl rounded-lg">
                                        <p className="text-sm font-bold text-foreground mb-1">{item.feature}</p>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: item.value > 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                                            />
                                            <span className="text-xs text-muted-foreground">Impact: </span>
                                            <span className={`text-xs font-mono font-bold ${item.value > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {item.value > 0 ? '+' : ''}{item.value.toFixed(4)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="value"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                    >
                        {sortedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.value > 0 ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))'}
                                fillOpacity={entry.value > 0 ? 0.9 : 0.6}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
