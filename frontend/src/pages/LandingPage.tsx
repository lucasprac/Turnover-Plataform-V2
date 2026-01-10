import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { Hero } from "@/components/ui/animated-hero";
import { TestimonialsEditorial } from "@/components/ui/editorial-testimonial";
import { Footer } from "@/components/ui/footer-section";
import { HudAreaChart } from "@/components/ui/hud-area-chart-1";

export const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans text-foreground selection:bg-primary/20">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0">
                <FlickeringGrid
                    squareSize={4}
                    gridGap={6}
                    color="#6B7280"
                    maxOpacity={0.15}
                    flickerChance={0.1}
                    className="w-full h-full mask-gradient"
                />
                {/* Gradient Overlay for Fade Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/50 to-background pointer-events-none" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Navigation placeholder */}
                <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-8 flex items-center justify-center pointer-events-none">
                            <div className="absolute inset-15 scale-[0.14] origin-center -translate-y-1">
                                <HudAreaChart
                                    showYAxis={false}
                                    data={[
                                        { time: "00:00", value: 20 },
                                        { time: "06:00", value: 50 },
                                        { time: "10:00", value: 10 },
                                        { time: "14:00", value: 30 },
                                        { time: "20:00", value: 40 },
                                        { time: "24:00", value: 50 },
                                    ]}
                                    scale={1}
                                    gradientColor="#6B7280"
                                    borderColor="#6B7280"
                                    dotColor="#6B7280"
                                    hideFrame={true}
                                />
                            </div>
                        </div>
                        <div className="text-xl font-bold tracking-tight">TurnoverAI</div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/demo/dashboard"
                            className="px-4 py-2 text-sm font-medium border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-colors"
                        >
                            Try Demo
                        </a>
                        <a
                            href="/login"
                            className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
                        >
                            Sign In
                        </a>
                    </div>
                </nav>

                <main className="flex-grow">
                    <Hero />

                    <section className="py-20">
                        <TestimonialsEditorial />
                    </section>
                </main>

                <Footer />
            </div>
        </div>
    );
};
