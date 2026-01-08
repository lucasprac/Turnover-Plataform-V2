import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/layout/Sidebar';
import axios from 'axios';
import { IndividualPrediction, PredictionSystem, BayesianIndividualPrediction } from '@/types';
import { PredictionSystemToggle } from '@/components/PredictionSystemToggle';
import { UncertaintyDisplay } from '@/components/UncertaintyDisplay';
import { ComputationWarning } from '@/components/ComputationWarning';
import { ContributionChart } from '../features/analytics/ContributionChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, User, Activity } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmployeeSummary {
    id: string;
    name: string;
    role: string;
    tenure_months: number;
}

export const IndividualPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [employeeDetails, setEmployeeDetails] = useState<any>(null);
    const [prediction, setPrediction] = useState<IndividualPrediction | null>(null);
    const [bayesianPrediction, setBayesianPrediction] = useState<BayesianIndividualPrediction | null>(null);
    const [predictionSystem, setPredictionSystem] = useState<PredictionSystem>('xgboost');
    const [analyzing, setAnalyzing] = useState(false);
    const [showGrouped, setShowGrouped] = useState(false);

    // Fetch employees on search
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoadingEmployees(true);
            try {
                const resp = await axios.get(`/api/employees?limit=20&search=${searchTerm}`);
                setEmployees(resp.data);
            } catch (e) {
                console.error("Failed to fetch employees", e);
            } finally {
                setLoadingEmployees(false);
            }
        };

        const timeoutId = setTimeout(fetchEmployees, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Fetch details and predict when selected
    const handleSelectEmployee = async (id: string, system: PredictionSystem = predictionSystem) => {
        setSelectedEmployeeId(id);
        setEmployeeDetails(null);
        setPrediction(null);
        setBayesianPrediction(null);
        setAnalyzing(true);

        try {
            // 1. Get Details
            const detailResp = await axios.get(`/api/employees/${id}`);
            setEmployeeDetails(detailResp.data);

            // 2. Get Prediction
            if (system === 'xgboost') {
                const predictResp = await axios.post('/api/predict/individual', { employee_id: id });
                setPrediction(predictResp.data);
            } else {
                const predictResp = await axios.post('/api/predict/individual/bayesian', { employee_id: id });
                setBayesianPrediction(predictResp.data);
            }
        } catch (e) {
            console.error("Analysis failed", e);
            alert("Failed to analyze employee. Make sure models are trained.");
        } finally {
            setAnalyzing(false);
        }
    };

    // Re-analyze when system changes if employee is selected
    useEffect(() => {
        if (selectedEmployeeId) {
            handleSelectEmployee(selectedEmployeeId, predictionSystem);
        }
    }, [predictionSystem]);

    const contributionData = prediction
        ? (showGrouped && prediction.grouped_contributions && prediction.grouped_contributions.length > 0
            ? prediction.grouped_contributions
            : (prediction.contributions || prediction.shap_values))
        : [];

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-light text-foreground tracking-tight">Individual Risk Analysis</h2>
                        <p className="text-muted-foreground font-light mt-1">Select an employee to view their turnover risk profile.</p>
                    </div>
                    <PredictionSystemToggle
                        value={predictionSystem}
                        onChange={setPredictionSystem}
                        disabled={analyzing}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">

                    {/* Left Column: Search & List */}
                    <div className="lg:col-span-3 flex flex-col gap-4">
                        <Card className="flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">Find Employee</CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by ID..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full">
                                    <div className="flex flex-col p-2 gap-1">
                                        {loadingEmployees && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>}
                                        {!loadingEmployees && employees.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">No employees found.</div>}
                                        {employees.map(emp => (
                                            <button
                                                key={emp.id}
                                                onClick={() => handleSelectEmployee(emp.id)}
                                                className={`flex flex-col items-start p-3 rounded-md text-left transition-colors hover:bg-muted/50 ${selectedEmployeeId === emp.id ? 'bg-secondary' : 'bg-background'}`}
                                            >
                                                <span className="font-medium text-sm">{emp.name}</span>
                                                <span className="text-xs text-muted-foreground">{emp.role} • {emp.tenure_months} mo</span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content: Profile & Risk */}
                    <div className="lg:col-span-9 flex flex-col h-[calc(100vh-12rem)]">
                        {!selectedEmployeeId ? (
                            <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-dashed">
                                <div className="p-4 bg-muted/30 rounded-full mb-4">
                                    <Search className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">No Employee Selected</h3>
                                <p className="text-muted-foreground text-sm max-w-xs mt-2">
                                    Search and select an employee from the list to view their detailed profile and risk analysis.
                                </p>
                            </Card>
                        ) : (
                            <Tabs defaultValue="profile" className="flex flex-col h-full overflow-hidden">
                                <div className="flex-none mb-4">
                                    <TabsList className="grid w-[400px] grid-cols-2">
                                        <TabsTrigger value="profile">
                                            <User className="mr-2 h-4 w-4" />
                                            Profile Details
                                        </TabsTrigger>
                                        <TabsTrigger value="risk">
                                            <Activity className="mr-2 h-4 w-4" />
                                            Risk Analysis
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-hidden min-h-0">
                                    <TabsContent value="profile" className="h-full mt-0 overflow-y-auto pr-2">
                                        <Card className="mb-6">
                                            <CardHeader className="pb-3 border-b">
                                                <CardTitle>Employee Profile</CardTitle>
                                                <CardDescription>
                                                    Detailed information for {selectedEmployeeId}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                {analyzing ? (
                                                    <div className="flex items-center justify-center p-12">
                                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                        <span className="ml-3 text-sm text-muted-foreground">Loading profile data...</span>
                                                    </div>
                                                ) : employeeDetails ? (
                                                    <div className="space-y-8">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                                                <div className="w-1 h-3 bg-primary rounded-full" />
                                                                Demographics
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 p-4 rounded-lg">
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Age</span> <span className="font-medium">{employeeDetails.a2_age}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Gender</span> <span className="font-medium">{employeeDetails.a1_gender}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Education</span> <span className="font-medium">{employeeDetails.a6_education_level}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Children</span> <span className="font-medium">{employeeDetails.a3_number_of_children}</span></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                                                <div className="w-1 h-3 bg-primary rounded-full" />
                                                                Professional Info
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 p-4 rounded-lg">
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Salary</span> <span className="font-medium">R$ {employeeDetails.B11_salary_today_brl}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Tenure</span> <span className="font-medium">{employeeDetails.B10_Tenure_in_month} months</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Role</span> <span className="font-medium">{employeeDetails.B14_Cargo || 'N/A'}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Sector</span> <span className="font-medium">{employeeDetails.B15_Sector || 'N/A'}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Headquarters</span> <span className="font-medium">{employeeDetails.B16_Headquarters || 'N/A'}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Commute</span> <span className="font-medium">{employeeDetails.B1_commute_distance_in_km} km</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Sickness Days</span> <span className="font-medium">{employeeDetails.B4_sickness_days}</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Gross Working Days</span> <span className="font-medium">{employeeDetails.B6_gross_working_days}</span></div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                                                                <div className="w-1 h-3 bg-primary rounded-full" />
                                                                Performance & Satisfaction
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm bg-muted/20 p-4 rounded-lg">
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Satisfaction</span> <span className="font-medium">{employeeDetails.c1_overall_employee_satisfaction}/10</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">eNPS</span> <span className="font-medium">{employeeDetails.M_eNPS}/10</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">PDI Rate</span> <span className="font-medium">{(employeeDetails.b1_PDI_rate * 100).toFixed(0)}%</span></div>
                                                                <div><span className="text-muted-foreground block text-xs mb-1">Onboarding Score</span> <span className="font-medium">{employeeDetails.M_Onboarding_Final_Score ? employeeDetails.M_Onboarding_Final_Score.toFixed(1) : 'N/A'}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center text-muted-foreground p-8">
                                                        No details available.
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="risk" className="h-full mt-0 flex flex-col gap-6 overflow-hidden">
                                        {/* Computation Warning for Bayesian */}
                                        {predictionSystem === 'bayesian' && analyzing && (
                                            <div className="flex-none">
                                                <ComputationWarning
                                                    mode="nuts"
                                                    isComputing={analyzing}
                                                />
                                            </div>
                                        )}

                                        {analyzing ? (
                                            <div className="h-full flex items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
                                                <div className="text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                                    <p className="text-sm font-medium">Running prediction models...</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {predictionSystem === 'bayesian'
                                                            ? 'Sampling posterior distributions...'
                                                            : 'Calculating turnover probability...'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (predictionSystem === 'xgboost' && prediction) ? (
                                            <>
                                                {/* Risk Score (XGBoost) */}
                                                <div className="flex-none">
                                                    <Card className={`text-center p-6 transition-colors border-2 ${prediction.turnover_probability > 0.5 ? 'bg-red-50/50 border-red-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
                                                        <div className="flex flex-row items-center justify-around px-4">
                                                            <div className="text-left">
                                                                <CardTitle className="text-lg font-bold text-foreground">Turnover Probability</CardTitle>
                                                                <CardDescription>Model confidence in attrition event within 1 year</CardDescription>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-5xl font-black ${prediction.turnover_probability > 0.5 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                                    {(prediction.turnover_probability * 100).toFixed(1)}%
                                                                </div>
                                                                <div className={`font-bold text-sm mt-1 uppercase tracking-wide px-3 py-1 rounded-full inline-block ${prediction.turnover_probability > 0.5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                    {prediction.turnover_probability > 0.5 ? 'High Risk' : 'Low Risk'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>

                                                {/* Top Drivers Chart (XGBoost) */}
                                                <div className="flex-1 min-h-[400px] overflow-hidden">
                                                    <Card className="h-full flex flex-col shadow-sm">
                                                        <CardHeader className="pb-2 flex flex-row items-center justify-between border-b flex-none">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-base font-semibold">Key Risk Drivers</CardTitle>
                                                                <CardDescription className="text-xs">Feature contribution analysis (Shapash)</CardDescription>
                                                            </div>
                                                            {prediction.grouped_contributions && prediction.grouped_contributions.length > 0 && (
                                                                <div className="flex bg-muted rounded-md p-0.5">
                                                                    <button
                                                                        onClick={() => setShowGrouped(false)}
                                                                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${!showGrouped ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                                    >
                                                                        Detailed
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setShowGrouped(true)}
                                                                        className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${showGrouped ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                                    >
                                                                        Grouped
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </CardHeader>
                                                        <CardContent className="flex-1 p-0 relative min-h-[300px]">
                                                            <div className="absolute inset-0 p-2">
                                                                <ContributionChart data={contributionData} />
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </>
                                        ) : (predictionSystem === 'bayesian' && bayesianPrediction) ? (
                                            <>
                                                {/* Uncertainty Display (Bayesian) */}
                                                <div className="flex-none">
                                                    <UncertaintyDisplay prediction={bayesianPrediction} />
                                                </div>

                                                {/* Placeholder for Drivers */}
                                                <div className="flex-1 min-h-[200px] flex items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50">
                                                    <div>
                                                        <p className="font-medium">Feature contributions not available for Bayesian model yet.</p>
                                                        <p className="text-xs mt-2">Focus on uncertainty intervals for risk assessment.</p>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <Card className="h-full flex items-center justify-center p-8 text-center text-muted-foreground border-dashed">
                                                <p className="text-sm">Risk analysis data not available.</p>
                                            </Card>
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};


