import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { GroupedShap } from '@/types';

interface GroupedFeatureImportanceProps {
    data: GroupedShap[];
    onGroupClick?: (groupName: string) => void;
}

// Discreet color palette (muted)
const GROUP_COLORS: Record<string, string> = {
    'Demographics': 'var(--color-purple)',
    'Job Details': 'var(--color-blue)',
    'Compensation': 'var(--color-orange)',
    'Performance & Satisfaction': 'var(--color-green)',
    'Attendance': 'var(--color-blue)',
    'Macroeconomic': 'var(--color-purple)',
    'Performance & Engagement': 'var(--color-green)',
    'Demographic': 'var(--color-purple)',
    'Professional': 'var(--color-blue)',
};

const DEFAULT_COLOR = 'var(--color-blue)';

export function GroupedFeatureImportance({ data, onGroupClick }: GroupedFeatureImportanceProps) {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    const maxValue = Math.max(...data.map(d => d.value), 0.001);
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    const handleGroupClick = (groupName: string) => {
        setExpandedGroup(prev => prev === groupName ? null : groupName);
        onGroupClick?.(groupName);
    };

    return (
        <div className="space-y-4">
            {sortedData.map((group, index) => {
                const colorVar = GROUP_COLORS[group.group] || DEFAULT_COLOR;
                const percentage = (group.value / totalValue) * 100;
                const barWidth = (group.value / maxValue) * 100;
                const isExpanded = expandedGroup === group.group;

                return (
                    <motion.div
                        key={group.group}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                        <button
                            onClick={() => handleGroupClick(group.group)}
                            className="w-full text-left group"
                        >
                            <div className="flex items-center gap-6 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2">
                                {/* Rank */}
                                <span className="text-xl font-light text-muted-foreground w-6">
                                    {(index + 1).toString().padStart(2, '0')}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-foreground">
                                            {group.group}
                                        </span>
                                        <span
                                            className="text-sm font-mono font-bold"
                                            style={{ color: `hsl(${colorVar})` }}
                                        >
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Minimal bar */}
                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barWidth}%` }}
                                            transition={{ delay: index * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: `hsl(${colorVar})`, opacity: 0.8 }}
                                        />
                                    </div>
                                </div>

                                {/* Chevron */}
                                <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-muted-foreground"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </button>

                        {/* Expandable details */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="py-3 pl-12 text-xs text-muted-foreground">
                                        <p>SHAP contribution: <span className="text-foreground font-mono">{group.value.toFixed(4)}</span></p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default GroupedFeatureImportance;
