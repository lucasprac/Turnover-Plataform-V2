import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Sidebar } from '@/layout/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Component as Loader } from '@/components/ui/loader-9';
import axios from 'axios';
import { ModelMetrics } from '@/types/index';
import '@/global.css';

export const SettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);

    // Bayesian Training State
    const [bayesianLoading, setBayesianLoading] = useState(false);
    const [bayesianStatus, setBayesianStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [bayesianMessage, setBayesianMessage] = useState('');
    const [bayesianProgress, setBayesianProgress] = useState(0);

    // Metrics State
    const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

    const fetchMetrics = async () => {
        try {
            const resp = await axios.get('/api/train/metrics');
            setModelMetrics(resp.data);
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);



    // Poll for status if loading (Legacy XGBoost)
    useEffect(() => {
        let interval: any;

        if (loading) {
            interval = setInterval(async () => {
                try {
                    const resp = await axios.get('/api/train/status');
                    const data = resp.data;

                    setProgress(data.progress);
                    setMessage(data.message);

                    if (data.status === 'success' || data.status === 'complete') {
                        setStatus('success');
                        setLoading(false);
                        setMessage("Training completed successfully.");
                        fetchMetrics(); // Refresh metrics after training
                    } else if (data.status === 'error') {
                        setStatus('error');
                        setLoading(false);
                        setMessage(data.message);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [loading]);

    // Poll for status if loading (Bayesian)
    useEffect(() => {
        let interval: any;

        if (bayesianLoading) {
            interval = setInterval(async () => {
                try {
                    const resp = await axios.get('/api/train/bayesian/status');
                    const data = resp.data;

                    setBayesianProgress(data.progress);
                    setBayesianMessage(data.message);

                    if (data.status === 'success' || data.status === 'complete') {
                        setBayesianStatus('success');
                        setBayesianLoading(false);
                        setBayesianMessage("Bayesian training completed successfully.");
                    } else if (data.status === 'error') {
                        setBayesianStatus('error');
                        setBayesianLoading(false);
                        setBayesianMessage(data.message);
                    }
                } catch (e) {
                    console.error("Bayesian polling error", e);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [bayesianLoading]);

    const handleTrain = async () => {
        setLoading(true);
        setStatus('idle');
        setMessage('Starting training...');
        setProgress(0);

        try {
            await axios.post('/api/train');
            // Polling will handle the rest
        } catch (e: any) {
            setStatus('error');
            setMessage(e.response?.data?.detail || 'Failed to trigger training.');
            setLoading(false);
        }
    };

    const handleTrainBayesian = async () => {
        setBayesianLoading(true);
        setBayesianStatus('idle');
        setBayesianMessage('Starting Bayesian training...');
        setBayesianProgress(0);

        try {
            await axios.post('/api/train/bayesian', {});
        } catch (e: any) {
            setBayesianStatus('error');
            setBayesianMessage(e.response?.data?.detail || 'Failed to trigger Bayesian training.');
            setBayesianLoading(false);
        }
    };

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-light text-foreground tracking-tight">System Settings</h2>
                    <p className="text-muted-foreground font-light mt-1">Manage models and application configuration.</p>
                </div>

                <div className="grid gap-6 max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Model Training</CardTitle>
                            <CardDescription>
                                Trigger the retraining of the employee turnover prediction models.
                                This process generates new synthetic data and updates both 1-year and 5-year models.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Status Messages */}
                            {!loading && status === 'success' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {message}
                                </div>
                            )}
                            {!loading && status === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Error: {message}
                                </div>
                            )}

                            {/* Loading State with Custom Loader */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                    <div className="scale-75 origin-center">
                                        <Loader />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-lg font-medium text-primary">{progress}%</p>
                                        <p className="text-sm text-muted-foreground">{message}</p>
                                    </div>
                                    {/* Optional Progress Bar HTML if needed besides the loader */}
                                    <div className="w-full bg-secondary rounded-full h-2.5 dark:bg-gray-700 max-w-xs mt-2">
                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleTrain} disabled={loading} className="w-full sm:w-auto">
                                {loading ? 'Training in Progress...' : 'Retrain Models'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Model Performance Metrics Card */}
                    {modelMetrics && (modelMetrics.one_year || modelMetrics.five_year) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>XGBoost Model Performance</CardTitle>
                                <CardDescription>
                                    Metrics from the latest training run.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {modelMetrics.one_year && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">One-Year Model (Individual)</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">ROC AUC</div>
                                                <div className="text-lg font-medium">{modelMetrics.one_year.roc_auc.toFixed(3)}</div>
                                            </div>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">F1 Score</div>
                                                <div className="text-lg font-medium">{modelMetrics.one_year.f1_score.toFixed(3)}</div>
                                            </div>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">Accuracy</div>
                                                <div className="text-lg font-medium">{modelMetrics.one_year.accuracy.toFixed(3)}</div>
                                            </div>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">RMSE</div>
                                                <div className="text-lg font-medium">{modelMetrics.one_year.rmse.toFixed(3)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modelMetrics.one_year && modelMetrics.five_year && <div className="h-px bg-border" />}

                                {modelMetrics.five_year && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3">Five-Year Model (Aggregate)</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">R2 Score</div>
                                                <div className="text-lg font-medium">{modelMetrics.five_year.r2_score.toFixed(3)}</div>
                                            </div>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">MAE</div>
                                                <div className="text-lg font-medium">{modelMetrics.five_year.mae.toFixed(3)}</div>
                                            </div>
                                            <div className="p-3 bg-secondary/50 rounded-lg">
                                                <div className="text-xs text-muted-foreground">RMSE</div>
                                                <div className="text-lg font-medium">{modelMetrics.five_year.rmse.toFixed(3)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Bayesian Model Training</CardTitle>
                            <CardDescription>
                                Train the probabilistic NumPyro model using NUTS (No-U-Turn Sampler) for uncertainty quantification.
                                This provides high-precision posterior estimates (~10-15 min).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Status Messages for Bayesian */}
                            {!bayesianLoading && bayesianStatus === 'success' && (
                                <div className="p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {bayesianMessage}
                                </div>
                            )}
                            {!bayesianLoading && bayesianStatus === 'error' && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Error: {bayesianMessage}
                                </div>
                            )}

                            {/* Loading State Bayesian */}
                            {bayesianLoading && (
                                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                                    <div className="scale-75 origin-center">
                                        <Loader />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-lg font-medium text-primary">{bayesianProgress}%</p>
                                        <p className="text-sm text-muted-foreground">{bayesianMessage}</p>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2.5 dark:bg-gray-700 max-w-xs mt-2">
                                        <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${bayesianProgress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleTrainBayesian} disabled={bayesianLoading || loading} variant="outline" className="w-full sm:w-auto">
                                {bayesianLoading ? 'Training Bayesian Model...' : 'Train Bayesian Model (NUTS)'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Application Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Version: 1.4.0</p>
                                <p>Environment: Development</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};


