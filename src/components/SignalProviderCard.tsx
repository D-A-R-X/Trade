'use client';

import React, { useState } from 'react';
import { Radio, Copy, Check, Send } from 'lucide-react';

interface SignalPayload {
  symbol: string;
  direction: string;
  decision: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  risk_reward: number;
  recommended_lot: number;
  projected_risk_usd: number;
  score: number;
  grade: string;
}

interface SignalProviderCardProps {
  signal: SignalPayload | null;
}

export const SignalProviderCard: React.FC<SignalProviderCardProps> = ({ signal }) => {
  const [copied, setCopied] = useState(false);

  const sig = signal || {
    symbol: 'XAUUSD',
    direction: 'LONG',
    decision: 'BUY SIGNAL',
    entry_price: 2650.0,
    stop_loss: 2643.7,
    take_profit: 2662.6,
    risk_reward: 2.0,
    recommended_lot: 0.16,
    projected_risk_usd: 100.0,
    score: 85.0,
    grade: 'A+',
  };

  const isBuy = sig.decision.includes('BUY') || sig.decision.includes('LONG');
  const isSell = sig.decision.includes('SELL') || sig.decision.includes('SHORT');

  const handleCopySignal = () => {
    const text = `🚨 SENTINEL X SIGNAL (${sig.symbol}) 🚨\nDirection: ${sig.direction}\nDecision: ${sig.decision}\nEntry: $${sig.entry_price}\nSL: $${sig.stop_loss}\nTP: $${sig.take_profit}\nRisk/Reward: 1:${sig.risk_reward}\nRec. Lot: ${sig.recommended_lot} ($${sig.projected_risk_usd} Risk)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramExport = async () => {
    try {
      const res = await fetch('/api/v1/export-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_data: sig }),
      });
      const data = await res.json();
      alert(data.message || 'Signal exported!');
    } catch (e) {
      alert('Telegram export failed.');
    }
  };

  return (
    <div className="bg-cardBg border border-borderBg rounded-lg p-4 shadow-lg flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Radio className="w-4 h-4 text-accentCyan" /> Live Signal Provider
          </h3>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold text-white animate-bounce ${
              isBuy ? 'bg-accentGreen' : isSell ? 'bg-accentRed' : 'bg-gray-600'
            }`}
          >
            {sig.decision}
          </span>
        </div>

        {/* Signal Levels Grid */}
        <div className="bg-darkBg border border-borderBg rounded-lg p-3 space-y-2 mb-3 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Direction:</span>
            <span className={`font-bold ${isBuy ? 'text-accentGreen' : 'text-accentRed'}`}>
              {sig.direction}
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-borderBg pt-1.5">
            <span className="text-gray-400">Entry Price:</span>
            <span className="font-bold text-white">${sig.entry_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Stop Loss (SL):</span>
            <span className="font-bold text-accentRed">${sig.stop_loss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Take Profit (TP):</span>
            <span className="font-bold text-accentGreen">${sig.take_profit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-borderBg pt-1.5">
            <span className="text-gray-400">Risk/Reward:</span>
            <span className="font-bold text-white">1 : {sig.risk_reward}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Rec. Position Size:</span>
            <span className="font-bold text-accentCyan">
              {sig.recommended_lot} Lots (${sig.projected_risk_usd} Risk)
            </span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleTelegramExport}
          className="bg-accentBlue hover:bg-blue-600 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Send className="w-3.5 h-3.5" /> Telegram Broadcast
        </button>
        <button
          onClick={handleCopySignal}
          className="bg-darkBg hover:bg-borderBg border border-borderBg text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accentGreen" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Signal'}
        </button>
      </div>
    </div>
  );
};
