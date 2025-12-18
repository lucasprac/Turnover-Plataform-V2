import { HudAreaChart } from "@/components/ui/hud-area-chart-1";
import { cn } from "@/lib/utils";

interface TurnoverLogoProps {
    className?: string; // Allow positioning/sizing via class
    scale?: number;     // Allow manual scale adjustment
    animate?: boolean;
}

export function TurnoverLogo({ className, scale = 1, animate = true }: TurnoverLogoProps) {
    // Standardized data for the brand logo
    const logoData = [
        { time: "00:00", value: 20 },
        { time: "06:00", value: 50 },
        { time: "10:00", value: 10 },
        { time: "16:00", value: 30 }, // Consistent with user edit
        { time: "20:00", value: 35 },
        { time: "24:00", value: 40 },
    ];

    return (
        <div className={cn("relative pointer-events-none", className)}>
            <div className="absolute inset-0 flex items-center justify-center">
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
                    <HudAreaChart
                        showYAxis={false}
                        data={logoData}
                        scale={1} // Pass 1 here, handle scale via parent transform to avoid double scaling issues or use the prop if preferred, but centering is easier this way
                        gradientColor="#6B7280"
                        borderColor="#6B7280"
                        dotColor="#6B7280"
                        hideFrame={true}
                        animate={animate}
                    />
                </div>
            </div>
        </div>
    );
}
