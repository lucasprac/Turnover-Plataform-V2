"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const testimonials = [
    {
        id: 1,
        quote: "The predictive accuracy has transformed our retention strategy.",
        author: "Sarah Chen",
        role: "HR Director",
        company: "TechFlow Inc.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=60",
    },
    {
        id: 2,
        quote: "Finally, we can understand why employees leave before they do.",
        author: "Marcus Webb",
        role: "VP of People",
        company: "Global Corp",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=60",
    },
    {
        id: 3,
        quote: "Data-driven decisions have never been easier or more impactful.",
        author: "Elena Voss",
        role: "Talent Acquisition",
        company: "Innovate Ltd",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&auto=format&fit=crop&q=60",
    },
]

export function TestimonialsEditorial() {
    const [active, setActive] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const handleChange = (index: number) => {
        if (index === active || isTransitioning) return
        setIsTransitioning(true)
        setTimeout(() => {
            setActive(index)
            setTimeout(() => setIsTransitioning(false), 50)
        }, 300)
    }

    const handlePrev = () => {
        const newIndex = active === 0 ? testimonials.length - 1 : active - 1
        handleChange(newIndex)
    }

    const handleNext = () => {
        const newIndex = active === testimonials.length - 1 ? 0 : active + 1
        handleChange(newIndex)
    }

    const current = testimonials[active]

    return (
        <div className="w-full max-w-4xl mx-auto px-6 py-16 relative z-10 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
            {/* Large index number */}
            <div className="flex items-start gap-8">
                <span
                    className="text-[120px] font-light leading-none text-foreground/10 select-none transition-all duration-500 hidden md:block"
                    style={{ fontFeatureSettings: '"tnum"' }}
                >
                    {String(active + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 pt-6">
                    {/* Quote */}
                    <blockquote
                        className={`text-2xl md:text-3xl font-light leading-relaxed text-foreground tracking-tight transition-all duration-300 min-h-[120px] ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                            }`}
                    >
                        "{current.quote}"
                    </blockquote>

                    {/* Author info with hover reveal */}
                    <div
                        className={`mt-10 group cursor-default transition-all duration-300 delay-100 ${isTransitioning ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-foreground/10 group-hover:ring-foreground/30 transition-all duration-300">
                                <img
                                    src={current.image || "/placeholder.svg"}
                                    alt={current.author}
                                    className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500"
                                />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{current.author}</p>
                                <p className="text-sm text-muted-foreground">
                                    {current.role}
                                    <span className="mx-2 text-foreground/20">/</span>
                                    <span className="group-hover:text-foreground transition-colors duration-300">{current.company}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation - vertical line selector */}
            <div className="mt-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        {testimonials.map((_, index) => (
                            <button key={index} onClick={() => handleChange(index)} className="group relative py-4">
                                <span
                                    className={cn(
                                        "block h-px transition-all duration-500 ease-out",
                                        index === active
                                            ? "w-12 bg-foreground"
                                            : "w-6 bg-foreground/20 group-hover:w-8 group-hover:bg-foreground/40"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground tracking-widest uppercase">
                        {String(active + 1).padStart(2, "0")} / {String(testimonials.length).padStart(2, "0")}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrev}
                        className="p-2 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-2 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
