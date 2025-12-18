import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Sidebar } from '@/layout/Sidebar';
import '@/global.css';
import axios from 'axios';
import { IndividualPrediction } from '@/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';

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
    const [analyzing, setAnalyzing] = useState(false);

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
    const handleSelectEmployee = async (id: string) => {
        setSelectedEmployeeId(id);
        setEmployeeDetails(null);
        setPrediction(null);
        setAnalyzing(true);

        try {
            // 1. Get Details
            const detailResp = await axios.get(`/api/employees/${id}`);
            setEmployeeDetails(detailResp.data);

            // 2. Get Prediction
            const predictResp = await axios.post('/api/predict/individual', { employee_id: id });
            setPrediction(predictResp.data);
        } catch (e) {
            console.error("Analysis failed", e);
            alert("Failed to analyze employee. Make sure models are trained.");
        } finally {
            setAnalyzing(false);
        }
    };

    const shapData = prediction ? prediction.shap_values : [];

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-light text-foreground tracking-tight">Individual Risk Analysis</h2>
                    <p className="text-muted-foreground font-light mt-1">Select an employee to view their turnover risk profile.</p>
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

                    {/* Middle Column: Details (Read Only) */}
                    <div className="lg:col-span-5 flex flex-col">
                        <Card className="h-full overflow-hidden flex flex-col">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle>Profile Details</CardTitle>
                                <CardDescription>
                                    {selectedEmployeeId ? `Viewing ${selectedEmployeeId}` : 'Select an employee'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-auto p-6">
                                {analyzing ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : employeeDetails ? (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider border-b pb-1">Demographics</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><span className="text-muted-foreground block">Age</span> {employeeDetails.a2_age}</div>
                                                <div><span className="text-muted-foreground block">Gender</span> {employeeDetails.a1_gender}</div>
                                                <div><span className="text-muted-foreground block">Education</span> {employeeDetails.a6_education_level}</div>
                                                <div><span className="text-muted-foreground block">Children</span> {employeeDetails.a3_number_of_children}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider border-b pb-1">Work</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><span className="text-muted-foreground block">Salary</span> R$ {employeeDetails.B11_salary_today_brl}</div>
                                                <div><span className="text-muted-foreground block">Tenure</span> {employeeDetails.B10_Tenure_in_month} months</div>
                                                <div><span className="text-muted-foreground block">Role</span> {employeeDetails.B14_Cargo || 'N/A'}</div>
                                                <div><span className="text-muted-foreground block">Sector</span> {employeeDetails.B15_Sector || 'N/A'}</div>
                                                <div><span className="text-muted-foreground block">Headquarters</span> {employeeDetails.B16_Headquarters || 'N/A'}</div>
                                                <div><span className="text-muted-foreground block">Commute</span> {employeeDetails.B1_commute_distance_in_km} km</div>
                                                <div><span className="text-muted-foreground block">Sickness Days</span> {employeeDetails.B4_sickness_days}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider border-b pb-1">Survey Scores</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div><span className="text-muted-foreground block">Satisfaction</span> {employeeDetails.c1_overall_employee_satisfaction}/10</div>
                                                <div><span className="text-muted-foreground block">eNPS</span> {employeeDetails.M_eNPS}/10</div>
                                                <div className="col-span-2"><span className="text-muted-foreground block">Onboarding Final</span> {employeeDetails.M_Onboarding_Final_Score ? employeeDetails.M_Onboarding_Final_Score.toFixed(1) : 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        Select an employee from the list to view details.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Prediction Results */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {prediction ? (
                            <>
                                <Card className={`text-center py-6 transition-colors ${prediction.turnover_probability > 0.5 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Turnover Risk</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-5xl font-black ${prediction.turnover_probability > 0.5 ? 'text-red-600' : 'text-green-600'}`}>
                                            {(prediction.turnover_probability * 100).toFixed(1)}%
                                        </div>
                                        <div className="mt-2 font-semibold text-base">
                                            {prediction.turnover_probability > 0.5 ? 'High Risk' : 'Low Risk'}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="flex-1 flex flex-col">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Top Drivers</CardTitle>
                                        <CardDescription>Key factors (SHAP)</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={shapData} layout="vertical" margin={{ left: 5, right: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 9, fill: '#6b7280' }} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                                    cursor={{ fill: '#f3f4f6' }}
                                                />
                                                <Bar dataKey="value" name="Impact" radius={[0, 4, 4, 0]}>
                                                    {shapData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f472b6' : '#818cf8'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground border-dashed">
                                <p className="text-sm">Risk analysis will appear here after selection.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};


