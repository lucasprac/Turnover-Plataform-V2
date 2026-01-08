"use client"

import { useMemo } from "react"

interface HudAreaChartProps {
    data: Array<{ time: string; value: number }>;
    showYAxis?: boolean;
    scale?: number;
    gradientColor?: string;
    borderColor?: string;
    dotColor?: string;
    hideFrame?: boolean;
    animate?: boolean;
}

export function HudAreaChart({
    data,
    showYAxis = false,
    scale = 1,
    gradientColor = "#6B7280",
    borderColor = "#6B7280",
    dotColor = "#6B7280",
    hideFrame = false,
    animate = true,
}: HudAreaChartProps) {

    const { pathD, areaD } = useMemo(() => {
        if (!data || data.length === 0) return { pathD: "", areaD: "" };

        const values = data.map(d => d.value);
        const max = Math.max(...values, 1); // Avoid div/0
        const width = 100;
        const height = 100;

        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (d.value / max) * height; // Invert Y for SVG
            return { x, y };
        });

        const pathD = "M" + points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" L");
        const areaD = pathD + ` L${width},${height} L0,${height} Z`;

        return { pathD, areaD };
    }, [data]);

    return (
        <div className={`w-full h-full ${!hideFrame ? "border rounded-md p-2" : ""}`}>
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
            >
                <defs>
                    <linearGradient id="hudGradientSVG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={gradientColor} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
                    </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                    d={areaD}
                    fill="url(#hudGradientSVG)"
                    stroke="none"
                />

                {/* Line stroke */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Y Axis line if needed */}
                {showYAxis && (
                    <line x1="0" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" opacity={0.5} />
                )}
            </svg>
        </div>
    )
}
