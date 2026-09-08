'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';

interface TradingViewChartProps {
  candles: CandlestickData[];
  symbol: string;
  timeframe: string;
  livePrice?: number;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles,
  symbol,
  timeframe,
  livePrice,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 0, // Normal
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#089981',
      downColor: '#f23645',
      borderUpColor: '#089981',
      borderDownColor: '#f23645',
      wickUpColor: '#089981',
      wickDownColor: '#f23645',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles || candles.length === 0) return;

    try {
      const formattedCandles: CandlestickData[] = [];
      const seenTimes = new Set<number>();

      for (const c of candles) {
        let rawTime = (c as any).time ?? (c as any).timestamp;
        let timeInSeconds: number | null = null;

        if (typeof rawTime === 'number') {
          timeInSeconds = rawTime > 1e10 ? Math.floor(rawTime / 1000) : Math.floor(rawTime);
        } else if (typeof rawTime === 'string') {
          const parsedDate = new Date(rawTime.includes(' ') ? rawTime.replace(' ', 'T') : rawTime);
          if (!isNaN(parsedDate.getTime())) {
            timeInSeconds = Math.floor(parsedDate.getTime() / 1000);
          }
        }

        if (timeInSeconds !== null && !isNaN(timeInSeconds) && !seenTimes.has(timeInSeconds)) {
          seenTimes.add(timeInSeconds);
          formattedCandles.push({
            time: timeInSeconds as any,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          });
        }
      }

      // Lightweight-charts requires strictly ascending time order
      formattedCandles.sort((a, b) => (a.time as number) - (b.time as number));

      if (formattedCandles.length > 0) {
        seriesRef.current.setData(formattedCandles);
      }
    } catch (err) {
      console.error('Error formatting candles for TradingView Chart:', err);
    }
  }, [candles]);

  return (
    <section className="bg-cardBg border border-borderBg rounded-lg p-3 flex flex-col shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-borderBg mb-2">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold">{symbol}</span>
          <span className="text-xs text-gray-400">{timeframe}</span>
          <span className="font-mono text-sm font-bold text-accentGreen">
            ${livePrice ? livePrice.toFixed(2) : '2,650.00'}
          </span>
        </div>
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accentGreen animate-pulse"></span> Live Chart Engine
        </div>
      </div>

      <div ref={chartContainerRef} className="w-full flex-1 min-h-[420px]" />
    </section>
  );
};
