import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Sidebar } from '@/layout/Sidebar';
import '@/global.css';
import axios from 'axios';
import { AggregatePrediction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users } from 'lucide-react';

interface AggregateFilters {
    education_level: string;
    gender: string;
    age_group: string;
    tenure_group: string;
}

export const AggregatePage = () => {
    const [filters, setFilters] = useState<AggregateFilters>({
        education_level: '',
        gender: '',
        age_group: '',
        tenure_group: ''
    });

    const [result, setResult] = useState<AggregatePrediction | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSelectChange = (name: keyof AggregateFilters, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value === 'all' ? '' : value }));
    };

    const handlePredict = async () => {
        setLoading(true);
        setResult(null);
        try {
            // Convert empty strings to None/null for backend if needed or handle logic there
            // Backend expects strings or None
            const payload = {
                education_level: filters.education_level || null,
                gender: filters.gender || null,
                age_group: filters.age_group || null,
                tenure_group: filters.tenure_group || null
            };
            const resp = await axios.post('/api/predict/aggregate', payload);
            setResult(resp.data);
        } catch (e) {
            alert('Prediction failed. Train models first!');
        } finally {
            setLoading(false);
        }
    };

    // Calculate churn rate for display
    const churnRate = result && result.total_in_cohort > 0
        ? (result.predicted_turnover_count / result.total_in_cohort) * 100
        : 0;

    const contributions = result ? (result.contributions || result.shap_values || []) : [];

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-light text-foreground tracking-tight">Group Forecast (5-Year)</h2>
                    <p className="text-muted-foreground font-light mt-1">Analyze turnover risk for specific workforce cohorts based on real data.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Filter Controls */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle>Cohort Filters</CardTitle>
                            <CardDescription>Define the group to analyze.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Education Level</Label>
                                <Select onValueChange={(val) => handleSelectChange('education_level', val)} value={filters.education_level || 'all'}>
                                    <SelectTrigger><SelectValue placeholder="All Levels" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="High School">High School</SelectItem>
                                        <SelectItem value="Bachelor">Bachelor</SelectItem>
                                        <SelectItem value="Master">Master</SelectItem>
                                        <SelectItem value="PhD">PhD</SelectItem>
                                        <SelectItem value="No Degree">No Degree</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select onValueChange={(val) => handleSelectChange('gender', val)} value={filters.gender || 'all'}>
                                    <SelectTrigger><SelectValue placeholder="All Genders" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Genders</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Age Group</Label>
                                <Select onValueChange={(val) => handleSelectChange('age_group', val)} value={filters.age_group || 'all'}>
                                    <SelectTrigger><SelectValue placeholder="All Ages" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ages</SelectItem>
                                        <SelectItem value="lt_25">&lt; 25</SelectItem>
                                        <SelectItem value="25_to_35">25 - 35</SelectItem>
                                        <SelectItem value="35_to_45">35 - 45</SelectItem>
                                        <SelectItem value="45_to_55">45 - 55</SelectItem>
                                        <SelectItem value="plus_55">55+</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tenure Group</Label>
                                <Select onValueChange={(val) => handleSelectChange('tenure_group', val)} value={filters.tenure_group || 'all'}>
                                    <SelectTrigger><SelectValue placeholder="All Tenures" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tenures</SelectItem>
                                        <SelectItem value="lt_1yr">&lt; 1 yr</SelectItem>
                                        <SelectItem value="1_to_3yr">1 - 3 yr</SelectItem>
                                        <SelectItem value="3_to_5yr">3 - 5 yr</SelectItem>
                                        <SelectItem value="5_to_10yr">5 - 10 yr</SelectItem>
                                        <SelectItem value="plus_10yr">10+ yr</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handlePredict} disabled={loading}>
                                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Forecasting...</> : 'Analyze Cohort'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Right Column: Results */}
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        {result ? (
                            <div className="grid gap-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <Card className="flex flex-col items-center justify-center p-6 text-center">
                                        <div className="mb-2 p-3 bg-primary/10 rounded-full text-primary">
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <div className="text-4xl font-bold text-foreground">{result.total_in_cohort}</div>
                                        <div className="text-sm text-muted-foreground mt-1">Employees in Cohort</div>
                                    </Card>

                                    <Card className="flex flex-col items-center justify-center p-6 text-center">
                                        <div className="text-4xl font-bold text-primary">{Math.round(result.predicted_turnover_count)}</div>
                                        <div className="text-sm text-muted-foreground mt-1">Projected Departures</div>
                                    </Card>
                                </div>

                                <Card className="p-8">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <h3 className="text-lg font-medium">Cohort Turnover Rate</h3>
                                                <span className="text-2xl font-bold">{churnRate.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={Math.min(100, churnRate)} className="h-4" />
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Predicted percentage of this cohort leaving within 5 years.
                                            </p>
                                        </div>

                                        {contributions.length > 0 && (
                                            <div className="pt-4 border-t border-border">
                                                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Key Risk Drivers (Contribution)</h4>
                                                <div className="space-y-3">
                                                    {contributions.map((shap, idx) => (
                                                        <div key={idx} className="flex items-center justify-between">
                                                            <span className="text-sm font-light text-foreground">{shap.feature}</span>
                                                            <div className="flex items-center gap-3 w-1/2">
                                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${shap.value > 0 ? 'bg-destructive' : 'bg-emerald-500'}`}
                                                                        style={{ width: `${Math.min(100, Math.abs(shap.value) * 100)}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs font-mono w-8 text-right">
                                                                    {shap.value > 0 ? '+' : ''}{shap.value.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <Card className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-dashed bg-muted/20">
                                <Users className="w-12 h-12 mb-4 opacity-20" />
                                <div>
                                    <p className="text-lg font-medium mb-1">No Analysis Generated</p>
                                    <p className="text-sm">Select filters and click <strong>Analyze Cohort</strong> to see forecasts.</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};


