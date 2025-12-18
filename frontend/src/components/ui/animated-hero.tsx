import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FlowButton } from "./flow-button";
import { HudAreaChart } from "@/components/ui/hud-area-chart-1";

export function Hero() {
    const navigate = useNavigate();
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["Forecasting", "Prevention", "Insight", "Analytics", "Strategy"],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="w-full relative z-10">
            <div className="container mx-auto">
                <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
                    <div className="relative w-full max-w-[200px] h-[100px] flex items-center justify-center mb-8 pointer-events-none">
                        <div className="absolute inset-15 scale-[0.5] origin-center -translate-y-0">
                            <HudAreaChart
                                showYAxis={false}
                                data={[
                                    { time: "00:00", value: 20 },
                                    { time: "06:00", value: 50 },
                                    { time: "10:00", value: 10 },
                                    { time: "16:00", value: 30 },
                                    { time: "20:00", value: 35 },
                                    { time: "24:00", value: 40 },
                                ]}
                                scale={1}
                                gradientColor="#6B7280"
                                borderColor="#6B7280"
                                dotColor="#6B7280"
                                hideFrame={true}
                            />
                        </div>
                    </div>
                    <div className="flex gap-4 flex-col">
                        <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-center font-regular">
                            <span className="text-muted-foreground text-3xl md:text-5xl block mb-2">Turnover Intelligence</span>
                            <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 min-h-[80px]">
                                &nbsp;
                                {titles.map((title, index) => (
                                    <motion.span
                                        key={index}
                                        className="absolute font-semibold"
                                        initial={{ opacity: 0, y: "-100" }}
                                        transition={{ type: "spring", stiffness: 50 }}
                                        animate={
                                            titleNumber === index
                                                ? {
                                                    y: 0,
                                                    opacity: 1,
                                                }
                                                : {
                                                    y: titleNumber > index ? -150 : 150,
                                                    opacity: 0,
                                                }
                                        }
                                    >
                                        {title}
                                    </motion.span>
                                ))}
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl leading-relaxed tracking-tight text-muted-foreground max-w-2xl text-center">
                            Empower your HR with predictive analytics. Identify risk, understand drivers, and retain your best talent with AI-driven insights.
                        </p>
                    </div>
                    <div className="flex flex-row gap-8 items-center mt-4">
                        <FlowButton text="Launch Dashboard" onClick={() => navigate('/dashboard')} />
                    </div>
                </div>
            </div>
        </div>
    );
}
