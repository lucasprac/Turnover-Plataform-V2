import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

interface Contribution {
    feature: string;
    value: number;
    base_value?: number;
    formatted_value?: string;
}

interface ContributionChartProps {
    data: Contribution[];
}

export function ContributionChart({ data }: ContributionChartProps) {
    // Sort data by absolute value to show most important features at top
    const sortedData = [...data].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-card w-full h-full"
        >
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                        type="number"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                    />
                    <YAxis
                        dataKey="feature"
                        type="category"
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}
                        width={150}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload[0]) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-popover p-3 rounded-lg border border-border shadow-md">
                                        <p className="font-medium text-popover-foreground mb-1">
                                            {data.feature}
                                        </p>
                                        <div className="text-xs text-muted-foreground flex flex-col gap-1">
                                            <p>
                                                Contribution: <span className={data.value > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                                                    {data.value.toFixed(4)}
                                                </span>
                                            </p>
                                            {data.base_value !== undefined && (
                                                <p>Base: {data.base_value.toFixed(4)}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                        cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                        {sortedData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.value > 0 ? '#10b981' : '#ef4444'} // Emerald-500 for positive, Red-500 for negative
                                fillOpacity={0.9}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
