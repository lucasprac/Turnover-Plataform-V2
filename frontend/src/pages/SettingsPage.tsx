import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Sidebar } from '@/layout/Sidebar';
import { NavBar } from '@/layout/NavBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Component as Loader } from '@/components/ui/loader-9';
import axios from 'axios';
import '@/global.css';

export const SettingsPage = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [progress, setProgress] = useState(0);

    // Poll for status if loading
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (loading) {
            interval = setInterval(async () => {
                try {
                    const resp = await axios.get('/api/train/status');
                    const data = resp.data;

                    setProgress(data.progress);
                    setMessage(data.message);

                    if (data.status === 'success') {
                        setStatus('success');
                        setLoading(false);
                        setMessage("Training completed successfully.");
                    } else if (data.status === 'error') {
                        setStatus('error');
                        setLoading(false);
                        setMessage(data.message); // Error message
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [loading]);

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

    return (
        <div className="flex bg-background min-h-screen font-sans text-foreground">
            <NavBar />
            <Sidebar />
            <main className="flex-1 ml-64 p-8 pt-24">
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Application Info</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-1">
                                <p>Version: 1.0.0</p>
                                <p>Environment: Development</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};


