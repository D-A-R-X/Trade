'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TradingViewChart } from '@/components/TradingViewChart';
import { AnalysisHud } from '@/components/AnalysisHud';
import { SignalProviderCard } from '@/components/SignalProviderCard';
import { SignalTrackerTable } from '@/components/SignalTrackerTable';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function DashboardPage() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('5m');
  const [timezone, setTimezone] = useState('UTC-3');

  const [candles, setCandles] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [signal, setSignal] = useState<any>(null);
  const [signalsList, setSignalsList] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_signals: 0, wins: 0, losses: 0, win_rate: 0 });
  const [apiKeyStatus, setApiKeyStatus] = useState({ hasKey: false, provider: 'twelvedata', maskedKey: '' });

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Fetch chart candles & analysis from API (FastAPI backend / Next API bridge)
  const fetchData = async () => {
    try {
      // Fetch Candles
      const candlesRes = await fetch(`/api/v1/candles?symbol=${symbol}&tf=${timeframe}`);
      if (candlesRes.ok) {
        const cData = await candlesRes.json();
        if (cData.candles) setCandles(cData.candles);
      }

      // Fetch Analysis & Signal
      const analyzeRes = await fetch(`/api/v1/analyze?symbol=${symbol}&tf=${timeframe}&tz=${timezone}`);
      if (analyzeRes.ok) {
        const aData = await analyzeRes.json();
        if (aData.analysis) setAnalysis(aData.analysis);
        if (aData.signal) setSignal(aData.signal);
      }

      // Fetch Signals History & Stats
      const statsRes = await fetch(`/api/v1/stats`);
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.stats) setStats(sData.stats);
        if (sData.signals) setSignalsList(sData.signals);
      }
    } catch (e) {
      console.warn('Backend API connection offline, running in mock/demo mode.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [symbol, timeframe, timezone]);

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col justify-between">
      <div>
        <Header
          symbol={symbol}
          setSymbol={setSymbol}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          timezone={timezone}
          setTimezone={setTimezone}
          apiKeyStatus={apiKeyStatus}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        <main className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col">
            <TradingViewChart
              candles={candles}
              symbol={symbol}
              timeframe={timeframe}
              livePrice={candles.length > 0 ? candles[candles.length - 1].close : undefined}
            />
          </div>

          <div className="flex flex-col gap-4">
            <AnalysisHud data={analysis} />
            <SignalProviderCard signal={signal} />
          </div>
        </main>
      </div>

      <SignalTrackerTable signals={signalsList} stats={stats} />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSuccess={() => {
          setApiKeyStatus({ hasKey: true, provider: 'twelvedata', maskedKey: '••••••••' });
          fetchData();
        }}
      />
    </div>
  );
}
