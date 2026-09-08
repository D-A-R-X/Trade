'use client';

import React from 'react';
import { Gauge } from 'lucide-react';

interface AnalysisData {
  score: number;
  long_score: number;
  short_score: number;
  grade: string;
  regime: string;
  direction: string;
  indicators: {
    ema_20: number;
    ema_50: number;
    atr: number;
    rsi: number;
    adx: number;
  };
}

interface AnalysisHudProps {
  data: AnalysisData | null;
}

export const AnalysisHud: React.FC<AnalysisHudProps> = ({ data }) => {
  const score = data ? data.score : 85.0;
  const grade = data ? data.grade : 'A+';
  const regime = data ? data.regime : 'TRENDING BULL';
  const longScore = data ? data.long_score : 85;
  const shortScore = data ? data.short_score : 15;
  const direction = data ? data.direction : 'LONG';
  const indicators = data ? data.indicators : { ema_20: 2648.5, ema_50: 2642.1, atr: 4.2, rsi: 58.2, adx: 24.5 };

  const gradeColors: Record<string, string> = {
    'A+': 'bg-accentGreen text-white',
    'A': 'bg-accentGreen text-white',
    'B': 'bg-accentBlue text-white',
    'C': 'bg-yellow-500 text-black',
    'F': 'bg-accentRed text-white',
  };

  return (
    <div className="bg-cardBg border border-borderBg rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white text-sm flex items-center gap-2">
          <Gauge className="w-4 h-4 text-accentBlue" /> Sentinel X Analysis HUD
        </h2>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColors[grade] || 'bg-gray-600'}`}>
          GRADE {grade}
        </span>
      </div>

      {/* Score Meter */}
      <div className="flex items-center justify-between bg-darkBg rounded-lg p-3 mb-3 border border-borderBg">
        <div>
          <div className="text-xs text-gray-400">Quality Score</div>
          <div className="text-3xl font-black text-white">
            {score} <span className="text-xs text-gray-500 font-normal">/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Market Regime</div>
          <div className="text-sm font-bold text-accentGreen">{regime}</div>
        </div>
      </div>

      {/* Score Power Bars */}
      <div className="space-y-2 mb-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Bullish Power</span>
            <span className="text-accentGreen font-bold">{longScore}%</span>
          </div>
          <div className="w-full bg-darkBg h-1.5 rounded-full overflow-hidden">
            <div className="bg-accentGreen h-full transition-all duration-500" style={{ width: `${longScore}%` }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Bearish Power</span>
            <span className="text-accentRed font-bold">{shortScore}%</span>
          </div>
          <div className="w-full bg-darkBg h-1.5 rounded-full overflow-hidden">
            <div className="bg-accentRed h-full transition-all duration-500" style={{ width: `${shortScore}%` }}></div>
          </div>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="bg-darkBg p-2 rounded border border-borderBg">
          <div className="text-gray-400">EMA 20/50</div>
          <div className={`font-bold mt-0.5 ${direction === 'LONG' ? 'text-accentGreen' : direction === 'SHORT' ? 'text-accentRed' : 'text-gray-400'}`}>
            {direction === 'LONG' ? 'BULL' : direction === 'SHORT' ? 'BEAR' : 'MIX'}
          </div>
        </div>
        <div className="bg-darkBg p-2 rounded border border-borderBg">
          <div className="text-gray-400">ADX</div>
          <div className="font-bold text-white mt-0.5">{indicators.adx}</div>
        </div>
        <div className="bg-darkBg p-2 rounded border border-borderBg">
          <div className="text-gray-400">RSI</div>
          <div className="font-bold text-white mt-0.5">{indicators.rsi}</div>
        </div>
        <div className="bg-darkBg p-2 rounded border border-borderBg">
          <div className="text-gray-400">ATR</div>
          <div className="font-bold text-white mt-0.5">{indicators.atr}</div>
        </div>
      </div>
    </div>
  );
};
