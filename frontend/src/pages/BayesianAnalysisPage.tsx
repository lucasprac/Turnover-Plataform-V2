import React, { useState, useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { Sidebar } from '@/layout/Sidebar';
import { ParameterBeliefsChart } from '@/components/bayesian/ParameterBeliefsChart';
import { UncertaintyPieChart } from '@/components/bayesian/UncertaintyPieChart';
import { PPCValidationPanel } from '@/components/bayesian/PPCValidationPanel';
import {
    ParameterBeliefsResponse,
    UncertaintyDecompositionResponse,
    PPCResponse
} from '@/types/interpretability';
import axios from 'axios';
import '@/global.css';

type TabType = 'parameters' | 'uncertainty' | 'ppc';

export function BayesianAnalysisPage() {
    const [activeTab, setActiveTab] = useState<TabType>('parameters');
    const pageRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const infoCardRef = useRef<HTMLDivElement>(null);

    // Data states
    const [parameterData, setParameterData] = useState<ParameterBeliefsResponse | null>(null);
    const [uncertaintyData, setUncertaintyData] = useState<UncertaintyDecompositionResponse | null>(null);
    const [ppcData, setPpcData] = useState<PPCResponse | null>(null);

    // Loading states
    const [parameterLoading, setParameterLoading] = useState(false);
    const [uncertaintyLoading, setUncertaintyLoading] = useState(false);
    const [ppcLoading, setPpcLoading] = useState(false);

    // Error states
    const [parameterError, setParameterError] = useState<string | null>(null);
    const [uncertaintyError, setUncertaintyError] = useState<string | null>(null);
    const [ppcError, setPpcError] = useState<string | null>(null);

    // Fetch parameter beliefs
    const fetchParameterBeliefs = async () => {
        setParameterLoading(true);
        setParameterError(null);
        try {
            const response = await axios.get('/api/bayesian/parameter-beliefs');
            setParameterData(response.data);
        } catch (err: any) {
            setParameterError(err.response?.data?.detail || 'Failed to fetch parameter beliefs');
        } finally {
            setParameterLoading(false);
        }
    };

    // Fetch uncertainty decomposition
    const fetchUncertaintyDecomposition = async () => {
        setUncertaintyLoading(true);
        setUncertaintyError(null);
        try {
            const response = await axios.post('/api/bayesian/uncertainty-decomposition');
            setUncertaintyData(response.data);
        } catch (err: any) {
            setUncertaintyError(err.response?.data?.detail || 'Failed to fetch uncertainty data');
        } finally {
            setUncertaintyLoading(false);
        }
    };

    // Fetch PPC results
    const fetchPPC = async () => {
        setPpcLoading(true);
        setPpcError(null);
        try {
            const response = await axios.post('/api/bayesian/ppc', null, {
                params: { n_replications: 500 }
            });
            setPpcData(response.data);
        } catch (err: any) {
            setPpcError(err.response?.data?.detail || 'Failed to run PPC');
        } finally {
            setPpcLoading(false);
        }
    };

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'parameters' && !parameterData && !parameterLoading) {
            fetchParameterBeliefs();
        } else if (activeTab === 'uncertainty' && !uncertaintyData && !uncertaintyLoading) {
            fetchUncertaintyDecomposition();
        } else if (activeTab === 'ppc' && !ppcData && !ppcLoading) {
            fetchPPC();
        }
    }, [activeTab]);

    // Load parameter beliefs on mount
    useEffect(() => {
        fetchParameterBeliefs();
    }, []);

    // Entrance animations on mount
    useEffect(() => {
        // Animate header
        if (headerRef.current) {
            animate(headerRef.current, {
                opacity: [0, 1],
                translateY: [-20, 0],
                duration: 600,
                ease: 'outExpo'
            });
        }

        // Animate tabs container
        if (tabsContainerRef.current) {
            animate(tabsContainerRef.current, {
                opacity: [0, 1],
                translateY: [30, 0],
                duration: 700,
                delay: 200,
                ease: 'outExpo'
            });
        }

        // Animate info card
        if (infoCardRef.current) {
            animate(infoCardRef.current, {
                opacity: [0, 1],
                translateY: [40, 0],
                duration: 700,
                delay: 400,
                ease: 'outExpo'
            });
        }
    }, []);

    // Tab content animation when tab changes
    useEffect(() => {
        if (contentRef.current) {
            animate(contentRef.current, {
                opacity: [0, 1],
                translateX: [20, 0],
                duration: 400,
                ease: 'outQuad'
            });
        }
    }, [activeTab]);

    const tabs = [
        { id: 'parameters' as TabType, label: 'Parameter Beliefs' },
        { id: 'uncertainty' as TabType, label: 'Uncertainty Analysis' },
        { id: 'ppc' as TabType, label: 'Model Validation' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64">
                <main className="flex-1 p-6 pt-8">
                    <div ref={pageRef} className="max-w-6xl mx-auto">
                        {/* Page Header */}
                        <div ref={headerRef} className="mb-6 relative z-10" style={{ opacity: 0 }}>
                            <h1 className="text-2xl font-bold text-gray-900">Bayesian Model Interpretability</h1>
                            <p className="text-gray-600 mt-1">
                                Explore model parameters, uncertainty sources, and validation metrics
                            </p>
                        </div>

                        {/* Tabs */}
                        <div ref={tabsContainerRef} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative z-0" style={{ opacity: 0 }}>
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                flex-1 py-4 px-6 text-center font-medium text-sm
                                                border-b-2 transition-all duration-300
                                                ${activeTab === tab.id
                                                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Tab Content */}
                            <div ref={contentRef} className="p-0 min-h-[600px]">
                                {activeTab === 'parameters' && (
                                    <div>
                                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Posterior distributions for model coefficients
                                            </span>
                                            <button
                                                onClick={fetchParameterBeliefs}
                                                disabled={parameterLoading}
                                                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                            >
                                                {parameterLoading ? 'Loading...' : '↻ Refresh'}
                                            </button>
                                        </div>
                                        <ParameterBeliefsChart
                                            data={parameterData}
                                            isLoading={parameterLoading}
                                            error={parameterError}
                                        />
                                    </div>
                                )}

                                {activeTab === 'uncertainty' && (
                                    <div>
                                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Decomposition of prediction uncertainty
                                            </span>
                                            <button
                                                onClick={fetchUncertaintyDecomposition}
                                                disabled={uncertaintyLoading}
                                                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                            >
                                                {uncertaintyLoading ? 'Loading...' : '↻ Refresh'}
                                            </button>
                                        </div>
                                        <UncertaintyPieChart
                                            data={uncertaintyData}
                                            isLoading={uncertaintyLoading}
                                            error={uncertaintyError}
                                        />
                                    </div>
                                )}

                                {activeTab === 'ppc' && (
                                    <div>
                                        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                                            <span className="text-sm text-gray-600">
                                                Posterior Predictive Checking for model validation
                                            </span>
                                            <button
                                                onClick={fetchPPC}
                                                disabled={ppcLoading}
                                                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                            >
                                                {ppcLoading ? 'Running PPC...' : '↻ Run PPC'}
                                            </button>
                                        </div>
                                        <PPCValidationPanel
                                            data={ppcData}
                                            isLoading={ppcLoading}
                                            error={ppcError}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Card */}
                        <div ref={infoCardRef} className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100" style={{ opacity: 0 }}>
                            <h3 className="font-semibold text-blue-900 mb-2">About Bayesian Interpretability</h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p>
                                    <strong>Parameter Beliefs:</strong> Shows what the model learned about each feature's effect on turnover.
                                </p>
                                <p>
                                    <strong>Uncertainty Analysis:</strong> Breaks down prediction uncertainty into reducible (epistemic) and irreducible (aleatoric) components.
                                </p>
                                <p>
                                    <strong>Model Validation:</strong> Compares observed data to model predictions to assess fit quality.
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default BayesianAnalysisPage;
