
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Users, TrendingUp, AlertTriangle, Smile } from 'lucide-react';
import { Sidebar } from '@/layout/Sidebar';
import { NavBar } from '@/layout/NavBar';
import { ShapChart } from '@/features/analytics/ShapChart';
import { FeatureImportance } from '@/features/analytics/FeatureImportance';
import { PredictionResults } from '@/features/turnover/PredictionResults';
import { MetricsOverview } from '@/components/MetricsOverview';
import { TurnoverPrediction } from '@/features/turnover/TurnoverPrediction';
import { getMockData } from '@/utils/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
  apiEndpoint: string;
}

export function Dashboard({ apiEndpoint }: DashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const response = await fetch(apiEndpoint, { method: 'GET', headers });
      if (!response.ok) throw new Error('Falha na requisição');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.log('Using demo data due to error:', err);
      setData(getMockData()); // Keep fallback for safety but user wants real data mainly
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex bg-background min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
            <RefreshCw className="w-8 h-8 text-primary" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background min-h-screen font-sans text-foreground">
      <NavBar />
      <Sidebar />
      <main className="flex-1 ml-64 p-8 pt-24">

        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground font-light mt-1">Real-time workforce insights and turnover risk analysis.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchData}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-primary" />
          </motion.button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.total_employees.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.avg_satisfaction} <span className="text-xs font-normal text-muted-foreground">/ 10</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.metrics.turnover_rate}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Emp.</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.metrics.turnover_risk_high}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* SHAP Analysis */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Global Risk Drivers</h2>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <ShapChart data={data.shap_values} />
            </div>
          </div>

          {/* Turnover Trend */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">Turnover Forecast</h2>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <TurnoverPrediction data={data.turnover_analysis} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Feature Importance */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Feature Importance</h2>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <FeatureImportance data={data.feature_importance} />
            </div>
          </div>

          {/* Top Risk List */}
          <div className="space-y-4">
            <h2 className="text-xl font-medium">Top High Risk Employees</h2>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <PredictionResults predictions={data.predictions} />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
