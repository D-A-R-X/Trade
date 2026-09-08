'use client';

import React, { useState } from 'react';
import { Key, X, Check } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [provider, setProvider] = useState('twelvedata');
  const [apiKey, setApiKey] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ text: 'Verifying API key against provider...', type: 'info' });

    try {
      const res = await fetch('/api/v1/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey }),
      });

      const data = await res.json();
      if (data.valid) {
        setFeedback({ text: data.message, type: 'success' });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setFeedback({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setFeedback({ text: 'Network error while verifying API key.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cardBg border border-borderBg rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-accentBlue" /> Configure Market Data API Key
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Provide your TwelveData or AlphaVantage API key to activate live real-time intraday data feeds and signal generation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">API Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-darkBg border border-borderBg text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-accentBlue"
            >
              <option value="twelvedata">TwelveData (Recommended - Free Key Available)</option>
              <option value="alphavantage">AlphaVantage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API Key..."
              required
              className="w-full bg-darkBg border border-borderBg text-white px-3 py-2 rounded text-xs focus:outline-none focus:border-accentBlue"
            />
          </div>

          {feedback && (
            <div
              className={`text-xs p-2 rounded border ${
                feedback.type === 'success'
                  ? 'bg-accentGreen/20 text-accentGreen border-accentGreen'
                  : feedback.type === 'error'
                  ? 'bg-accentRed/20 text-accentRed border-accentRed'
                  : 'bg-darkBg text-yellow-400 border-borderBg'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-darkBg hover:bg-borderBg text-gray-300 text-xs rounded font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accentBlue hover:bg-blue-600 text-white text-xs rounded font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Verify & Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
