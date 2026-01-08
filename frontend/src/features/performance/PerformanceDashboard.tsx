import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
    Info, Settings, History, Play, CheckCircle2,
    ArrowRight, BarChart3, Target, Sparkles, Filter,
    Database, BrainCircuit, Loader2, Save
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { X, LayoutPanelLeft } from "lucide-react";
import AnimeLoading from './AnimeLoading';

const FEATURE_GROUPS: Record<string, string[]> = {
    "Demographic": [
        "a1_gender", "a2_age", "a3_number_of_children", "a4_children_under_18_years",
        "a5_age_youngest_children", "a6_education_level", "B2_Public_service_status_ger"
    ],
    "Professional": [
        "B1_commute_distance_in_km", "B3_early_retirement_rate", "B4_sickness_days",
        "B5_Degree_of_employment", "B6_gross_working_days", "B7_Vacation_days",
        "B8_net_working_days", "B9_salary_increase_last_year", "B10_Tenure_in_month",
        "B11_salary_today_brl", "B12_salary_increase_last_5_years", "B13_Parental_leave",
        "B14_Cargo", "B15_Sector", "B16_Headquarters", "D1_monthly_unemployment_rate_brazil",
        "D2_monthly_number_of_vacancies", "D3_monthly_short_time_workers"
    ],
    "Performance & Engagement": [
        "b1_PDI_rate", "c1_overall_employee_satisfaction", "c2_employee_satisfaction_moving_average",
        "M_eNPS", "M_Onboarding_Final_Score"
    ]
};

interface PerformanceMetric {
    employee_id: string;
    ccr_efficiency: number;
    cross_efficiency: number;
    prospect_organizational: number;
    prospect_personal: number;
    prospect_management: number;
    composite_score: number;
}

interface PerformanceConfig {
    name: string;
    inputs: string[];
    outputs: string[];
    org_obj: number;
    personal_obj: number;
    mgmt_obj: number;
    timestamp?: string;
}

const DEFAULT_CONFIG: PerformanceConfig = {
    name: "Traditional Baseline",
    inputs: ['B10_Tenure_in_month', 'B11_salary_today_brl', 'b1_PDI_rate'],
    outputs: ['c1_overall_employee_satisfaction', 'M_eNPS', 'B9_salary_increase_last_year'],
    org_obj: 0.8,
    personal_obj: 1.0,
    mgmt_obj: 0.8
};

const PerformanceDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [availableColumns, setAvailableColumns] = useState<string[]>([]);
    const [savedConfigs, setSavedConfigs] = useState<PerformanceConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [evalPath, setEvalPath] = useState<'traditional' | 'customized'>('traditional');

    // Customization State
    const [config, setConfig] = useState<PerformanceConfig>(DEFAULT_CONFIG);
    const [configName, setConfigName] = useState("");

    useEffect(() => {
        fetchMetadata();
    }, []);

    const fetchMetadata = async () => {
        try {
            const [colRes, configRes] = await Promise.all([
                fetch('/api/performance/columns'),
                fetch('/api/performance/configs')
            ]);
            if (colRes.ok) setAvailableColumns(await colRes.json());
            if (configRes.ok) setSavedConfigs(await configRes.json());
        } catch (err) {
            console.error("Error fetching metadata:", err);
        }
    };

    const runEvaluation = async (activeConfig: PerformanceConfig) => {
        setIsStarted(true);
        setLoading(true);
        setProgress(0);
        setError(null);

        const pollInterval = setInterval(async () => {
            try {
                const statusRes = await fetch('/api/performance/status');
                const statusData = await statusRes.json();
                setProgress(statusData.progress);
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 1000);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('org_obj', activeConfig.org_obj.toString());
            queryParams.append('personal_obj', activeConfig.personal_obj.toString());
            queryParams.append('mgmt_obj', activeConfig.mgmt_obj.toString());
            activeConfig.inputs.forEach(i => queryParams.append('inputs', i));
            activeConfig.outputs.forEach(o => queryParams.append('outputs', o));

            const res = await fetch(`/api/performance/evaluate?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Evaluation failed");
            const data = await res.json();
            setMetrics(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            clearInterval(pollInterval);
            setProgress(100);
            setTimeout(() => setLoading(false), 500);
        }
    };

    const saveCurrentConfig = async () => {
        if (!configName) return;
        const newConfig = { ...config, name: configName, timestamp: new Date().toISOString() };
        try {
            const res = await fetch('/api/performance/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            if (res.ok) {
                setSavedConfigs([...savedConfigs, newConfig]);
                setConfigName("");
                fetchMetadata(); // Refresh
            }
        } catch (err) {
            console.error("Error saving config:", err);
        }
    };

    const handlePathSwitch = (path: 'traditional' | 'customized') => {
        setEvalPath(path);
        if (path === 'traditional') {
            setConfig(DEFAULT_CONFIG);
        }
    };

    if (!isStarted) {
        return (
            <div className="p-8 space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
                {/* Minimalist Header */}
                <div className="flex flex-col space-y-1 border-b border-muted pb-6">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground/90">Performance Intelligence</h1>
                    <p className="text-muted-foreground/70 text-base font-light max-w-2xl">
                        Advanced efficiency analysis utilizing Bounded Rationality and DEA peer-evaluation models.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Configuration Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <Tabs defaultValue="traditional" onValueChange={(v) => handlePathSwitch(v as any)} className="w-full">
                            <div className="flex items-center justify-between mb-6">
                                <TabsList className="bg-muted/30 p-1 rounded-lg border border-muted/50">
                                    <TabsTrigger
                                        value="traditional"
                                        className="px-6 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-semibold tracking-wide uppercase"
                                    >
                                        Standard Research
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="customized"
                                        className="px-6 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs font-semibold tracking-wide uppercase"
                                    >
                                        Custom Lab
                                    </TabsTrigger>
                                </TabsList>
                                <Badge variant="outline" className="h-6 px-3 rounded-full border-muted text-[10px] font-medium tracking-tight bg-muted/10">
                                    {evalPath === 'traditional' ? 'AUTO-VALIDATED' : 'MANUAL CONTROL'}
                                </Badge>
                            </div>

                            <TabsContent value="traditional" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="bg-muted/10 p-8 rounded-2xl border border-muted/30 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Sparkles className="w-20 h-20 text-foreground" />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-medium mb-3">Academic Baseline Model</h3>
                                        <p className="text-muted-foreground/80 leading-relaxed text-sm max-w-xl mb-8">
                                            Utilizes the industry-standard "Tenure-Salary-Satisfaction" equilibrium.
                                            Recommended for baseline organizational health audits and benchmark comparisons.
                                        </p>

                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Input Factors</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {DEFAULT_CONFIG.inputs.map(i => (
                                                        <Badge key={i} variant="secondary" className="bg-background/80 border-muted font-medium text-[11px] px-2.5 py-0.5">{i}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Target Metrics</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {DEFAULT_CONFIG.outputs.map(i => (
                                                        <Badge key={i} variant="outline" className="border-primary/20 bg-primary/5 text-primary font-medium text-[11px] px-2.5 py-0.5">{i}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => runEvaluation(DEFAULT_CONFIG)}
                                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-all"
                                        >
                                            Intialize Evaluation
                                            <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="customized" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-medium">Metric Selection Lab</h3>
                                            <p className="text-muted-foreground/60 text-xs">Configure custom inputs and outputs for peer evaluation.</p>
                                        </div>
                                    </div>

                                    <Accordion type="multiple" defaultValue={["Demographic"]} className="w-full space-y-2">
                                        {Object.entries(FEATURE_GROUPS).map(([group, members]) => {
                                            const groupAvailable = availableColumns.filter(c => members.includes(c));
                                            if (groupAvailable.length === 0) return null;

                                            return (
                                                <AccordionItem key={group} value={group} className="border border-muted/50 rounded-xl px-4 overflow-hidden bg-card/50">
                                                    <AccordionTrigger className="hover:no-underline py-4 text-sm font-semibold tracking-wide uppercase text-foreground/70">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-2 h-2 rounded-full bg-primary/30" />
                                                            <span>{group}</span>
                                                            <span className="ml-2 text-[10px] text-muted-foreground/50 border border-muted/50 px-1.5 rounded-full">{groupAvailable.length}</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                            {groupAvailable.map(col => {
                                                                const state = config.inputs.includes(col) ? 'in' : config.outputs.includes(col) ? 'out' : 'off';
                                                                return (
                                                                    <div key={col} className="flex items-center justify-between p-3 rounded-lg border border-muted/30 bg-muted/5 hover:border-muted-foreground/20 transition-colors group">
                                                                        <span className="text-xs font-medium truncate max-w-[140px] text-foreground/80">{col}</span>
                                                                        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-md border border-muted/50">
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (state === 'in') return;
                                                                                    setConfig({ ...config, inputs: [...config.inputs, col], outputs: config.outputs.filter(o => o !== col) });
                                                                                }}
                                                                                className={`w-7 h-5 flex items-center justify-center text-[9px] font-bold rounded transition-all ${state === 'in' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                                                                            >
                                                                                IN
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (state === 'out') return;
                                                                                    setConfig({ ...config, inputs: config.inputs.filter(i => i !== col), outputs: [...config.outputs, col] });
                                                                                }}
                                                                                className={`w-7 h-5 flex items-center justify-center text-[9px] font-bold rounded transition-all ${state === 'out' ? 'bg-emerald-600/80 text-white shadow-sm' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                                                                            >
                                                                                OUT
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newsIn = config.inputs.filter(i => i !== col);
                                                                                    const newsOut = config.outputs.filter(o => o !== col);
                                                                                    setConfig({ ...config, inputs: newsIn, outputs: newsOut });
                                                                                }}
                                                                                className={`w-7 h-5 flex items-center justify-center text-[9px] font-bold rounded transition-all ${state === 'off' ? 'bg-muted-foreground/10 text-muted-foreground/60' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                                                                            >
                                                                                OFF
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Interaction & Tuning Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="space-y-6 sticky top-8">
                            {/* Selection Overview */}
                            <div className="bg-card border border-muted/50 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />

                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Configuration Summary</h4>
                                    {(config.inputs.length > 0 || config.outputs.length > 0) && (
                                        <button
                                            onClick={() => setConfig({ ...config, inputs: [], outputs: [] })}
                                            className="text-[9px] font-bold uppercase text-destructive/60 hover:text-destructive transition-colors"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {config.inputs.length === 0 && config.outputs.length === 0 ? (
                                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                                            <LayoutPanelLeft className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-[10px] font-medium uppercase tracking-tighter">No metrics selected</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-primary uppercase">Inputs ({config.inputs.length})</span>
                                                    <div className="flex-1 h-[1px] bg-muted/50" />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {config.inputs.map(i => (
                                                        <Badge key={i} variant="secondary" className="bg-muted/50 text-[9px] h-5 rounded-md pr-1.5 group">
                                                            {i}
                                                            <X className="w-2 h-2 ml-1 cursor-pointer opacity-40 group-hover:opacity-100" onClick={() => setConfig({ ...config, inputs: config.inputs.filter(x => x !== i) })} />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Outputs ({config.outputs.length})</span>
                                                    <div className="flex-1 h-[1px] bg-muted/50" />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {config.outputs.map(i => (
                                                        <Badge key={i} variant="outline" className="border-emerald-200 bg-emerald-50/50 text-emerald-700 text-[9px] h-5 rounded-md pr-1.5 group">
                                                            {i}
                                                            <X className="w-2 h-2 ml-1 cursor-pointer opacity-40 group-hover:opacity-100" onClick={() => setConfig({ ...config, outputs: config.outputs.filter(x => x !== i) })} />
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sliders Area */}
                            <div className="bg-muted/10 border border-muted/50 rounded-2xl p-6 space-y-8">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Intelligence Tuning</h4>

                                <div className="space-y-6">
                                    {[
                                        { label: 'Management (MO)', value: config.mgmt_obj, key: 'mgmt_obj', color: 'text-slate-600' },
                                        { label: 'Organization (OO)', value: config.org_obj, key: 'org_obj', color: 'text-emerald-700' },
                                        { label: 'Personnel (PO)', value: config.personal_obj, key: 'personal_obj', color: 'text-teal-700' }
                                    ].map((s) => (
                                        <div key={s.key} className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                                                <span className={s.color}>{s.label}</span>
                                                <span className="tabular-nums font-mono border border-muted/50 px-1.5 rounded bg-background shadow-sm">{(s.value).toFixed(1)}</span>
                                            </div>
                                            <Slider
                                                value={[s.value]}
                                                min={0.1}
                                                max={1.0}
                                                step={0.1}
                                                onValueChange={([v]) => setConfig({ ...config, [s.key]: v })}
                                                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background"
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-muted/50">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Save config as..."
                                            className="h-9 text-[11px] bg-background/50 border-muted font-medium"
                                            value={configName}
                                            onChange={(e) => setConfigName(e.target.value)}
                                        />
                                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:bg-background border border-muted/50" onClick={saveCurrentConfig} disabled={!configName}>
                                            <Save className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => runEvaluation(config)}
                                        className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold h-11 rounded-lg transition-all"
                                        disabled={config.inputs.length === 0 || config.outputs.length === 0}
                                    >
                                        Execute Lab Analysis
                                    </Button>
                                </div>
                            </div>

                            {/* Minified History */}
                            {savedConfigs.length > 0 && (
                                <div className="px-2">
                                    <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3 flex items-center gap-2">
                                        <History className="w-3 h-3" /> Recent Labs
                                    </h4>
                                    <div className="space-y-2">
                                        {savedConfigs.slice(-3).reverse().map((sc, idx) => (
                                            <button
                                                key={idx}
                                                className="w-full text-left p-2.5 rounded-lg border border-transparent hover:border-muted/50 hover:bg-muted/30 transition-all group"
                                                onClick={() => setConfig(sc)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-medium truncate max-w-[120px]">{sc.name}</span>
                                                    <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                </div>
                                                <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                                                    {sc.inputs.length} Inputs • {sc.outputs.length} Outputs
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return <AnimeLoading progress={progress} />;
    }

    if (error) {
        return (
            <div className="p-8 max-w-2xl mx-auto">
                <Alert variant="destructive" className="border-2">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-lg font-bold">Process Error</AlertTitle>
                    <AlertDescription className="mt-2 text-md">{error}</AlertDescription>
                    <Button onClick={() => setIsStarted(false)} variant="outline" className="mt-4">Return to Settings</Button>
                </Alert>
            </div>
        );
    }

    // Results View
    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-1000 max-w-7xl mx-auto">
            {/* Results Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-muted pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground/90">Evaluation Metrics</h1>
                        <Badge variant="outline" className="h-6 px-3 rounded-full border-muted/50 text-[10px] font-bold tracking-widest bg-muted/5 text-muted-foreground/60">
                            {evalPath === 'traditional' ? 'TRADITIONAL' : 'CUSTOMIZED'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground/60 text-sm font-light">
                        Cross-efficiency analysis of <span className="font-semibold text-foreground/70">{metrics.length}</span> employees.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsStarted(false)}
                        className="h-9 px-4 rounded-lg border-muted text-[11px] font-bold uppercase tracking-tight hover:bg-muted/30 transition-all"
                    >
                        <Settings className="mr-2 w-3.5 h-3.5" />
                        Reconfigure Analysis
                    </Button>
                </div>
            </div>

            {/* Top KPIs */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: 'Management (MO)', value: (metrics.reduce((acc, curr) => acc + curr.prospect_management, 0) / metrics.length).toFixed(3), color: 'bg-slate-500', desc: 'Efficiency from management priority' },
                    { label: 'Organization (OO)', value: (metrics.reduce((acc, curr) => acc + curr.prospect_organizational, 0) / metrics.length).toFixed(3), color: 'bg-emerald-500', desc: 'Collective organizational output' },
                    { label: 'Personnel (PO)', value: (metrics.reduce((acc, curr) => acc + curr.prospect_personal, 0) / metrics.length).toFixed(3), color: 'bg-teal-500', desc: 'Individual development focus' },
                    { label: 'AI Consensus', value: (metrics.reduce((acc, curr) => acc + curr.composite_score, 0) / metrics.length).toFixed(3), color: 'bg-primary', desc: 'Weighted multi-objective score' }
                ].map((kpi, i) => (
                    <Card key={i} className="border border-muted/50 shadow-sm bg-card hover:shadow-md transition-shadow group overflow-hidden">
                        <div className={`h-1 w-full ${kpi.color} opacity-40`} />
                        <CardHeader className="p-5 pb-0">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">{kpi.label}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-2">
                            <div className="text-3xl font-semibold tabular-nums tracking-tight mb-1">{kpi.value}</div>
                            <p className="text-[10px] text-muted-foreground/40 font-medium leading-relaxed">{kpi.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Visualizations */}
            <Tabs defaultValue="elite" className="space-y-8">
                <div className="flex items-center justify-between border-b border-muted/50 pb-2">
                    <TabsList className="bg-transparent h-auto p-0 gap-8">
                        {['elite', 'landscape', 'utility'].map(tab => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="bg-transparent border-none p-0 pb-3 rounded-none text-xs font-bold uppercase tracking-widest text-muted-foreground/50 data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all shadow-none"
                            >
                                {tab === 'elite' ? 'Elite Rank' : tab === 'landscape' ? 'Perspective View' : 'Goal Distribution'}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="elite" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border border-muted/50 shadow-sm rounded-2xl overflow-hidden bg-card/50">
                        <div className="p-6 bg-muted/10 border-b border-muted/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="space-y-1">
                                <h3 className="text-md font-semibold text-foreground/80 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary/60" />
                                    Top 10 Benchmark Consensus
                                </h3>
                                <p className="text-xs text-muted-foreground/50">Ranking based on composite efficiency distribution</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/5">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-12">Employee</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-12">Composite</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-12">MO Index</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-12">OO Index</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 h-12">PO Index</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {metrics.sort((a, b) => b.composite_score - a.composite_score).slice(0, 10).map((emp) => (
                                        <TableRow key={emp.employee_id} className="hover:bg-muted/10 transition-colors border-muted/50">
                                            <TableCell className="font-mono text-[11px] font-bold py-4">{emp.employee_id}</TableCell>
                                            <TableCell>
                                                <Badge className="bg-primary/10 text-primary border-none font-mono text-[11px] hover:bg-primary/20 transition-colors">
                                                    {emp.composite_score.toFixed(4)}
                                                </Badge>
                                            </TableCell>
                                            {[
                                                { val: emp.prospect_management, col: 'bg-slate-500' },
                                                { val: emp.prospect_organizational, col: 'bg-emerald-500' },
                                                { val: emp.prospect_personal, col: 'bg-teal-500' }
                                            ].map((m, idx) => (
                                                <TableCell key={idx}>
                                                    <div className="space-y-2 w-32">
                                                        <div className="flex justify-between tabular-nums text-[10px] font-bold">
                                                            <span>{m.val.toFixed(2)}</span>
                                                        </div>
                                                        <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                                                            <div className={`h-full ${m.col} opacity-70`} style={{ width: `${m.val * 100}%` }} />
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="landscape" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border border-muted/50 shadow-sm bg-card/50 rounded-2xl overflow-hidden p-8">
                        <div className="mb-8 border-l-2 border-primary/20 pl-4">
                            <h3 className="text-md font-semibold text-foreground/80">Relative Efficiency Landscape</h3>
                            <p className="text-xs text-muted-foreground/60">Correlation: Self-Efficiency (CCR) vs. Collective Consensus (OO Index)</p>
                        </div>
                        <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                                    <XAxis
                                        type="number"
                                        dataKey="ccr_efficiency"
                                        domain={[0, 1]}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        label={{ value: 'Self-Efficiency (CCR)', position: 'bottom', offset: 20, fontSize: 10, fontWeight: 'bold' }}
                                        axisLine={{ opacity: 0.1 }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="prospect_organizational"
                                        domain={[0, 1]}
                                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                                        label={{ value: 'Perspective Consensus (OO)', angle: -90, position: 'left', offset: 20, fontSize: 10, fontWeight: 'bold' }}
                                        axisLine={{ opacity: 0.1 }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                                        cursor={{ strokeDasharray: '4 4', stroke: 'hsl(var(--primary))', opacity: 0.4 }}
                                    />
                                    <Scatter
                                        name="Employees"
                                        data={metrics}
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.4}
                                        stroke="hsl(var(--primary))"
                                        strokeWidth={1}
                                        shape="circle"
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="utility" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Card className="border border-muted/50 shadow-sm bg-card/50 rounded-2xl overflow-hidden p-8">
                        <div className="mb-8 border-l-2 border-primary/20 pl-4">
                            <h3 className="text-md font-semibold text-foreground/80">Objective Utility Distribution</h3>
                            <p className="text-xs text-muted-foreground/60">Stakeholder Satisfaction Benchmarks (Top 40 Samples)</p>
                        </div>
                        <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={metrics.slice(0, 40)} margin={{ bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="2 2" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="employee_id"
                                        angle={-45}
                                        textAnchor="end"
                                        tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                                        interval={0}
                                        axisLine={{ opacity: 0.1 }}
                                        tickLine={false}
                                    />
                                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ opacity: 0.1 }} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                    <Bar dataKey="prospect_management" name="MO" fill="#64748b" radius={[2, 2, 0, 0]} barSize={8} />
                                    <Bar dataKey="prospect_organizational" name="OO" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                                    <Bar dataKey="prospect_personal" name="PO" fill="#14b8a6" radius={[2, 2, 0, 0]} barSize={8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PerformanceDashboard;
