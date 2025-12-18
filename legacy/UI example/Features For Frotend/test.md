"use client";
import { useTheme } from "next-themes";
import { HudAreaChart } from "@/components/ui/hud-area-chart-1";

export default function Page() {
  const { theme } = useTheme();
  // Sample data for the graph
  const data = [
    { time: "00:00", value: 20 },
    { time: "06:00", value: 45 },
    { time: "10:00", value: 10 },
    { time: "14:00", value: 25 },
    { time: "20:00", value: 35 },
    { time: "24:00", value: 45 },
  ];
  return (
    <div className="bg-background min-h-screen overflow-hidden flex items-center justify-center">
      <HudAreaChart
        showYAxis={false}
        data={data}
        gradientColor={theme === "dark" ? "#ffffff" : "#000000"}
        borderColor={theme === "dark" ? "#ffffff" : "#000000"}
        dotColor={theme === "dark" ? "#ffffff" : "#000000"}
        dotSize={0.8}
        dotOpacity={0.1}
        scale={1}
      />
    </div>
  );
}
