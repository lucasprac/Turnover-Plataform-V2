import { motion } from 'motion/react';
import type { FeatureContribution } from '@/types';

interface ContributionDistributionProps {
    data: FeatureContribution[];
    onFeatureSelect?: (feature: string) => void;
}

export function ContributionDistribution({ data, onFeatureSelect }: ContributionDistributionProps) {
    const sortedByValue = [...data].sort((a, b) => b.value - a.value);
    const positiveDrivers = sortedByValue.filter(d => d.value > 0);
    const negativeDrivers = sortedByValue.filter(d => d.value < 0).reverse();
    const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 0.001);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Positive drivers */}
                <div>
                    <div className="flex items-center gap-1.5 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--color-red))' }} />
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                            Increase Risk
                        </span>
                    </div>
                    <div className="space-y-3">
                        {positiveDrivers.length > 0 ? (
                            positiveDrivers.map((item, idx) => (
                                <DriverRow
                                    key={item.feature}
                                    feature={item.feature}
                                    value={item.value}
                                    maxAbs={maxAbs}
                                    color="red"
                                    delay={idx * 0.05}
                                    onClick={() => onFeatureSelect?.(item.feature)}
                                />
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground uppercase opacity-50">No positive drivers</p>
                        )}
                    </div>
                </div>

                {/* Negative drivers */}
                <div>
                    <div className="flex items-center gap-1.5 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--color-green))' }} />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Decrease Risk
                        </span>
                    </div>
                    <div className="space-y-3">
                        {negativeDrivers.length > 0 ? (
                            negativeDrivers.map((item, idx) => (
                                <DriverRow
                                    key={item.feature}
                                    feature={item.feature}
                                    value={item.value}
                                    maxAbs={maxAbs}
                                    color="green"
                                    delay={idx * 0.05}
                                    onClick={() => onFeatureSelect?.(item.feature)}
                                />
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground uppercase opacity-50">No negative drivers</p>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

interface DriverRowProps {
    feature: string;
    value: number;
    maxAbs: number;
    color: 'green' | 'red';
    delay: number;
    onClick?: () => void;
}

function DriverRow({ feature, value, maxAbs, color, delay, onClick }: DriverRowProps) {
    const barWidth = (Math.abs(value) / maxAbs) * 100;
    const colorVar = color === 'red' ? 'var(--color-red)' : 'var(--color-green)';

    return (
        <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.3 }}
            onClick={onClick}
            className="w-full text-left group"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-foreground opacity-80 group-hover:opacity-100 transition-opacity uppercase tracking-tight">
                    {feature}
                </span>
                <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: `hsl(${colorVar})` }}
                >
                    {value > 0 ? '+' : ''}{value.toFixed(3)}
                </span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ delay: delay + 0.1, duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: `hsl(${colorVar})`, opacity: 0.8 }}
                />
            </div>
        </motion.button>
    );
}

export default ContributionDistribution;
