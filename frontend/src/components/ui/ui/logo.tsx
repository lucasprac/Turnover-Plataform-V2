import { HudAreaChart } from "@/components/ui/hud-area-chart-1";
import { cn } from "@/lib/utils";

interface TurnoverLogoProps {
    className?: string; // Allow positioning/sizing via class
    scale?: number;     // Allow manual scale adjustment
}

export function TurnoverLogo({ className, scale = 1 }: TurnoverLogoProps) {
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
            <HudAreaChart
                showYAxis={false}
                data={logoData}
                scale={scale}
                gradientColor="#6B7280"
                borderColor="#6B7280"
                dotColor="#6B7280"
                hideFrame={true} // Default to the "Graphic" look
            />
        </div>
    );
}
