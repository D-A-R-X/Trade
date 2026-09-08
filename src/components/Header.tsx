'use client';

import React from 'react';
import { LineChart, Key } from 'lucide-react';

interface HeaderProps {
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  apiKeyStatus: { hasKey: boolean; provider: string; maskedKey: string };
  onOpenApiKeyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  timezone,
  setTimezone,
  apiKeyStatus,
  onOpenApiKeyModal,
}) => {
  return (
    <header className="bg-cardBg border-b border-borderBg px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accentBlue flex items-center justify-center font-bold text-white shadow-lg">
          <LineChart className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">SENTINEL X</h1>
          <p className="text-xs text-gray-400">Trade Analysis & Real-Time Signal Provider (Next.js)</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Symbol Selector */}
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-darkBg border border-borderBg text-white px-3 py-1.5 rounded text-sm focus:outline-none focus:border-accentBlue cursor-pointer"
        >
          <option value="XAUUSD">GOLD (XAUUSD)</option>
          <option value="EURUSD">EUR / USD</option>
          <option value="GBPUSD">GBP / USD</option>
          <option value="BTCUSD">BITCOIN (BTCUSD)</option>
          <option value="AAPL">APPLE (AAPL)</option>
        </select>

        {/* Timeframe Selector */}
        <div className="flex bg-darkBg rounded border border-borderBg p-0.5">
          {['1m', '5m', '15m', '1h'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                timeframe === tf
                  ? 'bg-accentBlue text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Timezone Selector */}
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="bg-darkBg border border-borderBg text-white px-3 py-1.5 rounded text-xs focus:outline-none cursor-pointer"
        >
          <option value="UTC-3">UTC-3 (S. America)</option>
          <option value="UTC+0">UTC+0 (GMT)</option>
          <option value="UTC+5:30">UTC+5:30 (IST)</option>
          <option value="America/New_York">UTC-5 (EST / NY)</option>
        </select>

        {/* API Key Modal Button */}
        <button
          onClick={onOpenApiKeyModal}
          className="bg-darkBg hover:bg-borderBg border border-borderBg text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              apiKeyStatus.hasKey ? 'bg-accentGreen shadow-sm shadow-accentGreen' : 'bg-yellow-500'
            }`}
          ></span>
          <span>
            {apiKeyStatus.hasKey
              ? `API Key: ${apiKeyStatus.provider}`
              : 'API Key: Demo Feed'}
          </span>
          <Key className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </header>
  );
};
