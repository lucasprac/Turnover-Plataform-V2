import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Sidebar } from '@/layout/Sidebar';
import { Loader2, TrendingUp, AlertTriangle, Battery, Users } from 'lucide-react';

interface MotivationRecord {
    EmployeeID: string;
    Amotivation: number;
    Ext_Social: number;
    Ext_Material: number;
    Introjected: number;
    Identified: number;
    Intrinsic: number;
    Turnover: number;
}

export function MotivationPage() {
    const [data, setData] = useState<MotivationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:8000/motivation/data');
                if (!response.ok) {
                    throw new Error('Failed to fetch motivation data');
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("Error fetching motivation data:", err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate Summary Metrics
    const totalEmployees = data.length;
    const avgIntrinsic = data.reduce((acc, curr) => acc + curr.Intrinsic, 0) / (totalEmployees || 1);
    const avgExtrinsic = data.reduce((acc, curr) => acc + curr.Ext_Material + curr.Ext_Social, 0) / (totalEmployees || 1);
    const riskCount = data.filter(r => r.Turnover === 1).length;

    if (loading) {
        return (
            <div className="flex bg-background min-h-screen">
                <Sidebar />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-background min-h-screen">
                <Sidebar />
                <div className="flex-1 ml-64 flex items-center justify-center text-destructive">
                    ERROR: {error}
                </div>
            </div>
        );
    }

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-light text-foreground tracking-tight">Motivation Analysis</h2>
                    <p className="text-muted-foreground font-light mt-1">
                        Comprehensive view of employee motivation dimensions and turnover correlation.
                    </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Intrinsic</CardTitle>
                            <Battery className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgIntrinsic.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Self-driven motivation</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Extrinsic</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgExtrinsic.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">Rewards & Social</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalEmployees}</div>
                            <p className="text-xs text-muted-foreground">Employees</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Turnover Events</CardTitle>
                            <AlertTriangle className={`h-4 w-4 ${riskCount > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${riskCount > 0 ? 'text-red-600' : 'text-foreground'}`}>{riskCount}</div>
                            <p className="text-xs text-muted-foreground">{((riskCount / totalEmployees) * 100).toFixed(1)}% Rate</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Detailed Motivation Dimensions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[100px]">Emp ID</TableHead>
                                        <TableHead className="text-right">Amotivation</TableHead>
                                        <TableHead className="text-right">Ext Social</TableHead>
                                        <TableHead className="text-right">Ext Material</TableHead>
                                        <TableHead className="text-right">Introjected</TableHead>
                                        <TableHead className="text-right">Identified</TableHead>
                                        <TableHead className="text-right">Intrinsic</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, index) => (
                                        <TableRow key={index} className="transition-colors hover:bg-muted/50">
                                            <TableCell className="font-medium font-mono text-xs">{row.EmployeeID}</TableCell>
                                            <TableCell className="text-right">{row.Amotivation.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{row.Ext_Social.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{row.Ext_Material.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{row.Introjected.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{row.Identified.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">{row.Intrinsic.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.Turnover === 1
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {row.Turnover === 1 ? 'Left' : 'Active'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
