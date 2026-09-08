// Sentinel X Web Application Logic
document.addEventListener('DOMContentLoaded', () => {
    
    // State variables
    let currentSymbol = "XAUUSD";
    let currentTimeframe = "5m";
    let chart = null;
    let candlestickSeries = null;
    let autoRefreshInterval = null;
    let lastSignalData = null;

    // DOM Elements
    const symbolSelect = document.getElementById('symbolSelect');
    const tfButtons = document.querySelectorAll('.tf-btn');
    const timezoneSelect = document.getElementById('timezoneSelect');
    const openApiKeyModalBtn = document.getElementById('openApiKeyModal');
    const closeApiKeyModalBtn = document.getElementById('closeApiKeyModal');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyForm = document.getElementById('apiKeyForm');
    const modalProvider = document.getElementById('modalProvider');
    const modalApiKey = document.getElementById('modalApiKey');
    const modalVerifyFeedback = document.getElementById('modalVerifyFeedback');
    const btnCancelApiKey = document.getElementById('btnCancelApiKey');
    const apiKeyBadge = document.getElementById('apiKeyBadge');
    const apiKeyStatusText = document.getElementById('apiKeyStatusText');

    // Analysis HUD Elements
    const qualityScore = document.getElementById('qualityScore');
    const qualityGrade = document.getElementById('qualityGrade');
    const marketRegime = document.getElementById('marketRegime');
    const longScoreText = document.getElementById('longScoreText');
    const longScoreBar = document.getElementById('longScoreBar');
    const shortScoreText = document.getElementById('shortScoreText');
    const shortScoreBar = document.getElementById('shortScoreBar');
    const indEma = document.getElementById('indEma');
    const indAdx = document.getElementById('indAdx');
    const indRsi = document.getElementById('indRsi');
    const indAtr = document.getElementById('indAtr');

    // Signal Provider Elements
    const signalDecision = document.getElementById('signalDecision');
    const sigDirection = document.getElementById('sigDirection');
    const sigEntry = document.getElementById('sigEntry');
    const sigSl = document.getElementById('sigSl');
    const sigTp = document.getElementById('sigTp');
    const sigRr = document.getElementById('sigRr');
    const sigLot = document.getElementById('sigLot');
    const btnExportTelegram = document.getElementById('btnExportTelegram');
    const btnCopySignal = document.getElementById('btnCopySignal');

    // Signal History Elements
    const statTotal = document.getElementById('statTotal');
    const statWins = document.getElementById('statWins');
    const statLosses = document.getElementById('statLosses');
    const statWinRate = document.getElementById('statWinRate');
    const signalTableBody = document.getElementById('signalTableBody');

    // Initialize Lightweight Chart
    function initChart() {
        const container = document.getElementById('chartContainer');
        container.innerHTML = '';

        chart = LightweightCharts.createChart(container, {
            layout: {
                backgroundColor: '#131722',
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#1e222d' },
                horzLines: { color: '#1e222d' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
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

        candlestickSeries = chart.addCandlestickSeries({
            upColor: '#089981',
            downColor: '#f23645',
            borderUpColor: '#089981',
            borderDownColor: '#f23645',
            wickUpColor: '#089981',
            wickDownColor: '#f23645',
        });

        window.addEventListener('resize', () => {
            chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight
            });
        });
    }

    // Check API Key Status
    async function checkApiKeyStatus() {
        try {
            const res = await fetch('/api/v1/key-status');
            const data = await res.json();
            if (data.has_api_key) {
                apiKeyBadge.className = 'w-2 h-2 rounded-full bg-accentGreen shadow-sm shadow-accentGreen';
                apiKeyStatusText.innerText = `API Key: ${data.provider} (${data.masked_key})`;
            } else {
                apiKeyBadge.className = 'w-2 h-2 rounded-full bg-yellow-500';
                apiKeyStatusText.innerText = 'API Key: Demo Feed';
            }
        } catch (e) {
            console.error("API Key status check error:", e);
        }
    }

    // Load Price Data & Render Chart
    async function loadChartData() {
        try {
            document.getElementById('chartSymbolTitle').innerText = currentSymbol;
            document.getElementById('chartTfTitle').innerText = currentTimeframe;

            const res = await fetch(`/api/v1/candles?symbol=${currentSymbol}&timeframe=${currentTimeframe}&limit=100`);
            const data = await res.json();

            if (data.candles && data.candles.length > 0) {
                const formattedCandles = data.candles.map(c => ({
                    time: c.time || Math.floor(new Date(c.timestamp).getTime() / 1000),
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close
                })).sort((a, b) => a.time - b.time);

                candlestickSeries.setData(formattedCandles);

                const lastCandle = formattedCandles[formattedCandles.length - 1];
                document.getElementById('chartLivePrice').innerText = `$${lastCandle.close.toFixed(2)}`;
            }
        } catch (e) {
            console.error("Failed to load candles:", e);
        }
    }

    // Run Sentinel X Market Analysis
    async function runMarketAnalysis() {
        try {
            const res = await fetch('/api/v1/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: currentSymbol,
                    timeframe: currentTimeframe,
                    account_balance: 10000.0,
                    risk_percent: 1.0
                })
            });

            const data = await res.json();
            if (data.error) return;

            // Update Quality Score & Grade
            qualityScore.innerHTML = `${data.score} <span class="text-xs text-gray-500 font-normal">/ 100</span>`;
            qualityGrade.innerText = `GRADE ${data.grade}`;
            
            const gradeColors = {
                'A+': 'bg-accentGreen text-white',
                'A': 'bg-accentGreen text-white',
                'B': 'bg-accentBlue text-white',
                'C': 'bg-yellow-500 text-black',
                'F': 'bg-accentRed text-white'
            };
            qualityGrade.className = `px-2 py-0.5 rounded text-xs font-bold ${gradeColors[data.grade] || 'bg-gray-600'}`;

            marketRegime.innerText = data.regime;

            // Score Power Bars
            longScoreText.innerText = `${data.long_score}%`;
            longScoreBar.style.width = `${data.long_score}%`;
            shortScoreText.innerText = `${data.short_score}%`;
            shortScoreBar.style.width = `${data.short_score}%`;

            // Indicators
            indEma.innerText = data.direction == 'LONG' ? 'BULL' : data.direction == 'SHORT' ? 'BEAR' : 'MIX';
            indEma.className = `font-bold mt-0.5 ${data.direction == 'LONG' ? 'text-accentGreen' : data.direction == 'SHORT' ? 'text-accentRed' : 'text-gray-400'}`;
            indAdx.innerText = data.indicators.adx;
            indRsi.innerText = data.indicators.rsi;
            indAtr.innerText = data.indicators.atr;

            // Signal Box
            const sig = data.signal;
            lastSignalData = { ...sig, symbol: currentSymbol, score: data.score, grade: data.grade };

            signalDecision.innerText = sig.decision;
            const decisionBg = sig.decision.includes('BUY') || sig.decision.includes('LONG') ? 'bg-accentGreen' : sig.decision.includes('SELL') || sig.decision.includes('SHORT') ? 'bg-accentRed' : 'bg-gray-600';
            signalDecision.className = `px-2.5 py-1 rounded text-xs font-bold text-white ${decisionBg}`;

            sigDirection.innerText = `${sig.direction}`;
            sigDirection.className = `font-bold ${sig.direction == 'LONG' ? 'text-accentGreen' : 'text-accentRed'}`;
            sigEntry.innerText = `$${sig.entry_price.toFixed(2)}`;
            sigSl.innerText = `$${sig.stop_loss.toFixed(2)}`;
            sigTp.innerText = `$${sig.take_profit.toFixed(2)}`;
            sigRr.innerText = `1 : ${sig.risk_reward}`;
            sigLot.innerText = `${sig.recommended_lot} Lots ($${sig.projected_risk_usd} Risk)`;

            // Reload Signal Tracker Table
            loadSignalsAndStats();

        } catch (e) {
            console.error("Analysis error:", e);
        }
    }

    // Load Signal History & Stats Table
    async function loadSignalsAndStats() {
        try {
            const res = await fetch('/api/v1/signals?limit=20');
            const data = await res.json();

            // Stats
            statTotal.innerText = data.stats.total_signals;
            statWins.innerText = data.stats.wins;
            statLosses.innerText = data.stats.losses;
            statWinRate.innerText = `${data.stats.win_rate}%`;

            // Table rows
            if (data.signals && data.signals.length > 0) {
                signalTableBody.innerHTML = data.signals.map(s => `
                    <tr class="hover:bg-darkBg transition">
                        <td class="p-2.5 text-gray-400">#${s.id}</td>
                        <td class="p-2.5 font-mono text-gray-300">${s.entry_time}</td>
                        <td class="p-2.5 font-bold text-white">${s.symbol} (${s.timeframe})</td>
                        <td class="p-2.5 font-bold ${s.direction == 'LONG' ? 'text-accentGreen' : 'text-accentRed'}">${s.direction}</td>
                        <td class="p-2.5 font-mono">$${s.entry_price.toFixed(2)}</td>
                        <td class="p-2.5 font-mono text-accentRed">$${s.stop_loss.toFixed(2)}</td>
                        <td class="p-2.5 font-mono text-accentGreen">$${s.take_profit.toFixed(2)}</td>
                        <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-darkBg text-accentCyan border border-borderBg">${s.score} (${s.grade})</span></td>
                        <td class="p-2.5 font-mono">${s.recommended_lot} Lots</td>
                        <td class="p-2.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.result == 'WIN' ? 'bg-accentGreen text-white' : s.result == 'LOSS' ? 'bg-accentRed text-white' : 'bg-gray-700 text-gray-300'}">${s.result}</span></td>
                    </tr>
                `).join('');
            }
        } catch (e) {
            console.error("Signal stats error:", e);
        }
    }

    // Event Listeners
    symbolSelect.addEventListener('change', (e) => {
        currentSymbol = e.target.value;
        loadChartData();
        runMarketAnalysis();
    });

    tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tfButtons.forEach(b => b.classList.remove('active', 'bg-accentBlue', 'text-white'));
            tfButtons.forEach(b => b.classList.add('text-gray-400'));
            btn.classList.add('active', 'bg-accentBlue', 'text-white');
            btn.classList.remove('text-gray-400');

            currentTimeframe = btn.dataset.tf;
            loadChartData();
            runMarketAnalysis();
        });
    });

    // API Key Modal
    openApiKeyModalBtn.addEventListener('click', () => apiKeyModal.classList.remove('hidden'));
    closeApiKeyModalBtn.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
    btnCancelApiKey.addEventListener('click', () => apiKeyModal.classList.add('hidden'));

    apiKeyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const provider = modalProvider.value;
        const apiKey = modalApiKey.value.trim();

        modalVerifyFeedback.className = 'text-xs p-2 rounded bg-darkBg border border-borderBg text-yellow-400';
        modalVerifyFeedback.innerText = 'Verifying API key...';
        modalVerifyFeedback.classList.remove('hidden');

        try {
            const res = await fetch('/api/v1/verify-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, api_key: apiKey })
            });

            const data = await res.json();
            if (data.valid) {
                modalVerifyFeedback.className = 'text-xs p-2 rounded bg-accentGreen/20 text-accentGreen border border-accentGreen';
                modalVerifyFeedback.innerText = data.message;
                setTimeout(() => {
                    apiKeyModal.classList.add('hidden');
                    checkApiKeyStatus();
                    loadChartData();
                    runMarketAnalysis();
                }, 1000);
            } else {
                modalVerifyFeedback.className = 'text-xs p-2 rounded bg-accentRed/20 text-accentRed border border-accentRed';
                modalVerifyFeedback.innerText = data.message;
            }
        } catch (err) {
            modalVerifyFeedback.className = 'text-xs p-2 rounded bg-accentRed/20 text-accentRed border border-accentRed';
            modalVerifyFeedback.innerText = 'Network error while verifying API key.';
        }
    });

    // Copy Signal to Clipboard
    btnCopySignal.addEventListener('click', () => {
        if (!lastSignalData) return;
        const text = `🚨 SENTINEL X SIGNAL (${lastSignalData.symbol}) 🚨\nDirection: ${lastSignalData.direction}\nEntry: $${lastSignalData.entry_price}\nSL: $${lastSignalData.stop_loss}\nTP: $${lastSignalData.take_profit}\nRisk/Reward: 1:${lastSignalData.risk_reward}\nRec. Lot: ${lastSignalData.recommended_lot}`;
        navigator.clipboard.writeText(text);
        btnCopySignal.innerHTML = `<i class="fa-solid fa-check text-accentGreen"></i> Copied!`;
        setTimeout(() => {
            btnCopySignal.innerHTML = `<i class="fa-solid fa-copy"></i> Copy Signal`;
        }, 2000);
    });

    // Broadcast Signal to Telegram
    btnExportTelegram.addEventListener('click', async () => {
        if (!lastSignalData) return;
        try {
            const res = await fetch('/api/v1/export-signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signal_data: lastSignalData })
            });
            const data = await res.json();
            alert(data.message);
        } catch (e) {
            alert("Telegram export failed.");
        }
    });

    // Initialization
    initChart();
    checkApiKeyStatus();
    loadChartData();
    runMarketAnalysis();

    // Auto Refresh every 10 seconds
    autoRefreshInterval = setInterval(() => {
        loadChartData();
        runMarketAnalysis();
    }, 10000);
});
