import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Sidebar } from '@/layout/Sidebar';
import { Loader2, TrendingUp, AlertTriangle, Battery, Users, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface MotivationRecord {
    id: string;
    Amotivation: number;
    Ext_Social: number;
    Ext_Material: number;
    Introjected: number;
    Identified: number;
    Intrinsic: number;
    Turnover: number;
}

interface MotivationPageProps {
    mode?: 'demo' | 'production';
}

export function MotivationPage({ mode = 'demo' }: MotivationPageProps) {
    const [data, setData] = useState<MotivationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: keyof MotivationRecord; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/${mode}/motivation/data`);
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

    // Sorting logic
    const requestSort = (key: keyof MotivationRecord) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: keyof MotivationRecord) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return sortConfig.direction === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    };

    // Filter and Sort Data
    const processedData = [...data]
        .filter(item => {
            const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all'
                ? true
                : statusFilter === 'active'
                    ? item.Turnover === 0
                    : item.Turnover === 1;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <CardTitle className="text-lg font-medium">Detailed Motivation Dimensions</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search Employee ID..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[130px] h-9">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="left">Left</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead
                                            className="w-[120px] cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('id')}
                                        >
                                            <div className="flex items-center">Emp ID {getSortIcon('id')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Amotivation')}
                                        >
                                            <div className="flex items-center justify-end">Amotivation {getSortIcon('Amotivation')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Ext_Social')}
                                        >
                                            <div className="flex items-center justify-end">Ext Social {getSortIcon('Ext_Social')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Ext_Material')}
                                        >
                                            <div className="flex items-center justify-end">Ext Material {getSortIcon('Ext_Material')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Introjected')}
                                        >
                                            <div className="flex items-center justify-end">Introjected {getSortIcon('Introjected')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Identified')}
                                        >
                                            <div className="flex items-center justify-end">Identified {getSortIcon('Identified')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-right cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Intrinsic')}
                                        >
                                            <div className="flex items-center justify-end">Intrinsic {getSortIcon('Intrinsic')}</div>
                                        </TableHead>
                                        <TableHead
                                            className="text-center cursor-pointer hover:bg-muted transition-colors"
                                            onClick={() => requestSort('Turnover')}
                                        >
                                            <div className="flex items-center justify-center">Status {getSortIcon('Turnover')}</div>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {processedData.length > 0 ? (
                                        processedData.map((row, index) => (
                                            <TableRow key={index} className="transition-colors hover:bg-muted/50">
                                                <TableCell className="font-medium font-mono text-xs">{row.id}</TableCell>
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
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                No results found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
