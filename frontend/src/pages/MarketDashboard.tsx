import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, Award, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

interface MarketDashboardProps {
    onBack: () => void;
}

interface MarketData {
    summary: {
        attractiveness_score: number;
        nps_proxy: number;
        avg_engagement: number;
        avg_competitiveness: number;
        sentiment_distribution: Record<string, number>;
    };
    trends: Array<{ month: string; score: number }>;
}

export function MarketDashboard({ onBack }: MarketDashboardProps) {
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch dashboard data
        axios.get('http://localhost:8000/market-dashboard-data')
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load market data", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-400">Analyzing Market Data...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-red-400">Failed to load data. Ensure backend is running.</div>;
    }

    const { summary, trends } = data;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Attractiveness</h1>
                    <p className="text-muted-foreground">Employer Branding & Internal Market Health</p>
                </div>
            </div>

            {/* Top Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border-emerald-900/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Attractiveness Score
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-400">{summary.attractiveness_score}</div>
                        <p className="text-xs text-slate-400">Composite index (0-100)</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            eNPS (Proxy)
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{summary.nps_proxy}%</div>
                        <p className="text-xs text-slate-400">Employee Promoters</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Competitiveness
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{(summary.avg_competitiveness).toFixed(2)}x</div>
                        <p className="text-xs text-slate-400">vs Market Average</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Engagement
                        </CardTitle>
                        <Award className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-100">{summary.avg_engagement}</div>
                        <p className="text-xs text-slate-400">Avg Score (1-10)</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Chart */}
                <Card className="col-span-2 bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle>Attractiveness Trend</CardTitle>
                        <CardDescription>Historical performance of employer brand score</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" domain={[60, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sentiment Distribution */}
                <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                        <CardTitle>Brand Sentiment</CardTitle>
                        <CardDescription>Employee perception breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(summary.sentiment_distribution).map(([key, val]) => (
                            <div key={key} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="capitalize">{key}</span>
                                    <span className="font-bold">{val}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${key === 'Positive' ? 'bg-emerald-500' :
                                            key === 'Negative' ? 'bg-red-500' : 'bg-slate-500'
                                            }`}
                                        style={{ width: `${val}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
