import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ObjectiveSelectionProps {
    onSelect: (objective: 'turnover' | 'market') => void;
}

export function ObjectiveSelection({ onSelect }: ObjectiveSelectionProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                    Enterprise Analytics
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                    Select your strategic objective to access specialized insights and predictive models.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
                {/* Turnover Card */}
                <div
                    onClick={() => onSelect('turnover')}
                    className="group cursor-pointer relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-xl transition-all duration-500 group-hover:blur-2xl opacity-0 group-hover:opacity-100" />
                    <Card className="relative h-full border-slate-700 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group-hover:border-blue-500/50 group-hover:translate-y-[-4px]">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <CardTitle className="text-2xl text-slate-100">Turnover Prediction</CardTitle>
                            <CardDescription className="text-slate-400">
                                Analyze workforce stability and predict employee churn risks using advanced machine learning.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-slate-400 mb-6">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Risk Analysis
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Retention Strategies
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                    Employee Satisfaction
                                </li>
                            </ul>
                            <div className="flex items-center text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                Launch Module <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Market Card */}
                <div
                    onClick={() => onSelect('market')}
                    className="group cursor-pointer relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl transition-all duration-500 group-hover:blur-2xl opacity-0 group-hover:opacity-100" />
                    <Card className="relative h-full border-slate-700 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 group-hover:border-emerald-500/50 group-hover:translate-y-[-4px]">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <TrendingUp className="w-6 h-6 text-emerald-400" />
                            </div>
                            <CardTitle className="text-2xl text-slate-100">Market Attractiveness</CardTitle>
                            <CardDescription className="text-slate-400">
                                Evaluate employer branding strength and internal market competitiveness.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-slate-400 mb-6">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Brand Health
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Competitive Analysis
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Endomarketing Impact
                                </li>
                            </ul>
                            <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                Launch Module <ArrowRight className="w-4 h-4 ml-2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
