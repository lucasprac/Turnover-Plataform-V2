import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Info } from 'lucide-react';
import { Sidebar } from '@/layout/Sidebar';
import { NavBar } from '@/layout/NavBar';
import { ContributionChart } from '../features/analytics/ContributionChart';
import { GroupedFeatureImportance } from '../features/analytics/GroupedFeatureImportance';
import { CompacityChart } from '../features/analytics/CompacityChart';
import { ContributionDistribution } from '../features/analytics/ContributionDistribution';
import { PredictionResults } from '@/features/turnover/PredictionResults';
import type { DashboardData } from '@/types';

interface DashboardProps {
  mode?: 'demo' | 'production';
}

type AnalysisTab = 'global' | 'groups' | 'compacity' | 'drivers';

const TABS: { id: AnalysisTab; label: string }[] = [
  { id: 'global', label: 'Global Risk' },
  { id: 'groups', label: 'Feature Groups' },
  { id: 'compacity', label: 'Compacity' },
  { id: 'drivers', label: 'Drivers' },
];

export function Dashboard({ mode = 'demo' }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('global');

  // Determine API endpoint based on mode
  const apiEndpoint = mode === 'production'
    ? '/api/app/dashboard-data'
    : '/api/demo/dashboard-data';

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiEndpoint);
      if (!response.ok) throw new Error('Request failed');
      const result = await response.json();
      setData(result);
    } catch {
      // Mock data fallback
      setData({
        metrics: { total_employees: 1500, avg_satisfaction: 7.2, turnover_rate: 12.5, turnover_risk_high: 89 },
        shap_values: [
          { feature: 'Satisfaction Score', value: 0.245 },
          { feature: 'Tenure (Months)', value: -0.189 },
          { feature: 'Monthly Salary', value: -0.156 },
          { feature: 'eNPS Score', value: 0.134 },
          { feature: 'Commute Distance', value: 0.098 }
        ],
        grouped_shap: [
          { group: 'Performance & Satisfaction', value: 0.42 },
          { group: 'Job Details', value: 0.28 },
          { group: 'Compensation', value: 0.18 },
          { group: 'Demographics', value: 0.08 },
          { group: 'Attendance', value: 0.03 },
          { group: 'Macroeconomic', value: 0.01 }
        ],
        predictions: [
          { id: 'EMP00123', name: 'Employee EMP00123', risk: 0.87 },
          { id: 'EMP00456', name: 'Employee EMP00456', risk: 0.82 },
          { id: 'EMP00789', name: 'Employee EMP00789', risk: 0.78 }
        ],
        feature_importance: [
          { feature: 'Satisfaction', importance: 0.28 },
          { feature: 'Tenure', importance: 0.22 },
          { feature: 'Salary', importance: 0.18 },
          { feature: 'eNPS', importance: 0.15 },
          { feature: 'Distance', importance: 0.09 },
          { feature: 'Age', importance: 0.05 },
          { feature: 'Education', importance: 0.03 }
        ],
        turnover_analysis: []
      });
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
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-6 h-6 text-foreground" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex bg-background min-h-screen">
      <NavBar />
      <Sidebar />
      <main className="flex-1 ml-64 p-8 pt-24">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-foreground tracking-tight">
                People Analytics
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Workforce insights and turnover risk analysis
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium shadow-sm hover:shadow-md transition-shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </motion.button>
          </div>
        </div>

        {/* Metric Cards - More compact grid and smaller cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <MetricCard
            label="Total Employees"
            value={data.metrics.total_employees.toLocaleString()}
            color="blue"
          />
          <MetricCard
            label="Avg Satisfaction"
            value={data.metrics.avg_satisfaction.toString()}
            suffix="/10"
            color="green"
          />
          <MetricCard
            label="Turnover Rate"
            value={`${data.metrics.turnover_rate}`}
            suffix="%"
            color="orange"
          />
          <MetricCard
            label="High Risk"
            value={data.metrics.turnover_risk_high.toString()}
            color="red"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-1 border-b border-border pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                                    px-4 py-2 text-sm transition-all duration-200 relative
                                    ${activeTab === tab.id
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-foreground"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'global' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ContentCard title="Global Risk Drivers">
                  <ContributionChart data={data.shap_values} />
                </ContentCard>
                <ContentCard title="High Risk Employees">
                  <PredictionResults predictions={data.predictions} />
                </ContentCard>
              </div>
            )}

            {activeTab === 'groups' && (
              <ContentCard title="Feature Group Analysis" subtitle="SHAP contributions by category">
                <GroupedFeatureImportance data={data.grouped_shap} />
              </ContentCard>
            )}

            {activeTab === 'compacity' && (
              <ContentCard title="Feature Compacity" subtitle="Minimal feature set for model accuracy">
                <CompacityChart
                  data={{ feature_importance: data.feature_importance }}
                  targetAccuracy={0.85}
                />
              </ContentCard>
            )}

            {activeTab === 'drivers' && (
              <ContentCard title="Turnover Drivers" subtitle="Positive vs negative impact factors">
                <ContributionDistribution data={data.shap_values} />
              </ContentCard>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

function MetricCard({ label, value, suffix, color }: MetricCardProps) {
  const colorMap = {
    blue: 'var(--color-blue)',
    green: 'var(--color-green)',
    orange: 'var(--color-orange)',
    red: 'var(--color-red)',
    purple: 'var(--color-purple)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-figma relative overflow-hidden p-5"
    >
      {/* Small status indicator - Discreet Color */}
      <div
        className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: `hsl(${colorMap[color]})` }}
      />

      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
          {label}
        </p>
        <div className="metric-value text-foreground flex items-baseline gap-1">
          {value}
          {suffix && (
            <span className="text-sm text-muted-foreground font-normal">
              {suffix}
            </span>
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 accent-line accent-line-${color}`}
      />
    </motion.div>
  );
}

// Content Card
interface ContentCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function ContentCard({ title, subtitle, children }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-figma p-6"
    >
      <div className="mb-6">
        <h2 className="text-base font-semibold text-foreground uppercase tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
