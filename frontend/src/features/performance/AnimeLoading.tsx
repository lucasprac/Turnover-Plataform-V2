import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

interface AnimeLoadingProps {
    progress: number;
}

const AnimeLoading: React.FC<AnimeLoadingProps> = ({ progress }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const linesRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!gridRef.current || !linesRef.current) return;

        // Animate the grid of balls
        const dotAnimation = animate('.anime-dot', {
            scale: [
                { to: 0.1, ease: 'outSine', duration: 500 },
                { to: 1, ease: 'inOutQuad', duration: 1200 }
            ],
            opacity: [
                { to: 0.2, ease: 'outSine', duration: 500 },
                { to: 1, ease: 'inOutQuad', duration: 1200 }
            ],
            delay: stagger(200, { grid: [4, 4], from: 'center' }),
            loop: true,
            alternate: true,
            ease: 'inOutSine'
        });

        // Animate the passing lines using pathLength="1000" technique
        const lineAnimation = animate('.anime-line', {
            strokeDashoffset: [1000, 0],
            ease: 'inOutSine',
            duration: 2500,
            delay: stagger(500),
            loop: true,
            alternate: true
        });

        // Floating effect for the whole container
        const floatingAnimation = animate(gridRef.current, {
            translateY: [-10, 10],
            duration: 3000,
            alternate: true,
            loop: true,
            ease: 'inOutQuad'
        });

        return () => {
            dotAnimation.pause();
            lineAnimation.pause();
            floatingAnimation.pause();
        };
    }, []);

    const dots = Array.from({ length: 16 }).map((_, i) => (
        <div
            key={i}
            className="anime-dot w-2.5 h-2.5 rounded-full bg-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
        />
    ));

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-16 p-8 animate-in fade-in duration-1000">
            <div ref={gridRef} className="relative w-48 h-48 flex items-center justify-center">
                {/* Grid of Balls */}
                <div className="grid grid-cols-4 gap-8 z-10">
                    {dots}
                </div>

                {/* Lines Passing Around */}
                <svg
                    ref={linesRef}
                    viewBox="0 0 160 160"
                    className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
                >
                    <defs>
                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <path
                        className="anime-line"
                        d="M 20 20 Q 80 0, 140 20 T 140 140 Q 80 160, 20 140 T 20 20"
                        stroke="url(#lineGrad)"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        pathLength="1000"
                        strokeDasharray="1000"
                    />
                    <path
                        className="anime-line"
                        d="M 0 80 Q 80 40, 160 80 T 80 120 T 0 80"
                        stroke="url(#lineGrad)"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        pathLength="1000"
                        strokeDasharray="1000"
                    />
                    <path
                        className="anime-line"
                        d="M 80 0 Q 120 80, 80 160 T 40 80 T 80 0"
                        stroke="url(#lineGrad)"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        pathLength="1000"
                        strokeDasharray="1000"
                    />
                </svg>
            </div>

            <div className="w-full max-w-sm space-y-8 text-center">
                <div className="space-y-4">
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground/90">Processing Intelligence</h2>
                    <p className="text-muted-foreground/60 font-medium text-xs uppercase tracking-[0.3em]">
                        Executing DEA Optimization Phase
                    </p>
                </div>

                <div className="space-y-4 pt-4">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-primary px-1">
                        <span>Analysis Depth</span>
                        <span className="tabular-nums font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden border border-muted/50 p-[1px]">
                        <div
                            className="h-full bg-primary transition-all duration-700 ease-out rounded-full shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 px-6 py-3 bg-muted/30 border border-muted/50 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mx-auto w-fit backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
                    <span>Solving Peer-Evaluation Consensus (Models 6, 7, 9)</span>
                </div>
            </div>
        </div>
    );
};

export default AnimeLoading;
