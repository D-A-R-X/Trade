'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';

interface SignalRecord {
  id: number;
  entry_time: string;
  symbol: string;
  timeframe: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  score: number;
  grade: string;
  recommended_lot: number;
  result: string;
}

interface StatsData {
  total_signals: number;
  wins: number;
  losses: number;
  win_rate: number;
}

interface SignalTrackerTableProps {
  signals: SignalRecord[];
  stats: StatsData;
}

export const SignalTrackerTable: React.FC<SignalTrackerTableProps> = ({ signals, stats }) => {
  return (
    <footer className="p-4 pt-0">
      <div className="bg-cardBg border border-borderBg rounded-lg p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-borderBg pb-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-accentBlue" /> Signal Tracker & Win Rate Analytics
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div>
              Total Signals: <span className="font-bold text-white">{stats.total_signals}</span>
            </div>
            <div>
              Wins: <span className="font-bold text-accentGreen">{stats.wins}</span>
            </div>
            <div>
              Losses: <span className="font-bold text-accentRed">{stats.losses}</span>
            </div>
            <div className="bg-darkBg px-3 py-1 rounded border border-borderBg font-bold text-accentGreen">
              Win Rate: <span>{stats.win_rate}%</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-darkBg text-gray-400 font-semibold border-b border-borderBg">
              <tr>
                <th className="p-2.5">ID</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Asset</th>
                <th className="p-2.5">Direction</th>
                <th className="p-2.5">Entry Price</th>
                <th className="p-2.5">Stop Loss</th>
                <th className="p-2.5">Take Profit</th>
                <th className="p-2.5">Score</th>
                <th className="p-2.5">Lot Size</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderBg">
              {signals && signals.length > 0 ? (
                signals.map((s) => (
                  <tr key={s.id} className="hover:bg-darkBg transition">
                    <td className="p-2.5 text-gray-400">#{s.id}</td>
                    <td className="p-2.5 font-mono text-gray-300">{s.entry_time}</td>
                    <td className="p-2.5 font-bold text-white">
                      {s.symbol} ({s.timeframe})
                    </td>
                    <td
                      className={`p-2.5 font-bold ${
                        s.direction === 'LONG' ? 'text-accentGreen' : 'text-accentRed'
                      }`}
                    >
                      {s.direction}
                    </td>
                    <td className="p-2.5 font-mono">${s.entry_price.toFixed(2)}</td>
                    <td className="p-2.5 font-mono text-accentRed">${s.stop_loss.toFixed(2)}</td>
                    <td className="p-2.5 font-mono text-accentGreen">${s.take_profit.toFixed(2)}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-darkBg text-accentCyan border border-borderBg">
                        {s.score} ({s.grade})
                      </span>
                    </td>
                    <td className="p-2.5 font-mono">{s.recommended_lot} Lots</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.result === 'WIN'
                            ? 'bg-accentGreen text-white'
                            : s.result === 'LOSS'
                            ? 'bg-accentRed text-white'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {s.result}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-4 text-center text-gray-500">
                    No trade signals recorded yet. Active signals will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </footer>
  );
};
