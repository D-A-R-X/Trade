import os
import requests
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.database import init_db, save_setting, get_setting, save_signal, get_signals, get_signal_stats
from app.sentinel_engine import SentinelXEngine
from app.market_data import MarketDataProvider

app = FastAPI(title="Sentinel X Trade Analysis & Signal Provider", version="2.0.0")

# Enable CORS for local/remote web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class KeyVerificationRequest(BaseModel):
    provider: str = "twelvedata"
    api_key: str

class AnalysisRequest(BaseModel):
    symbol: str = "XAUUSD"
    timeframe: str = "5m"
    account_balance: float = 10000.0
    risk_percent: float = 1.0

class ExportSignalRequest(BaseModel):
    signal_id: Optional[int] = None
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    webhook_url: Optional[str] = None
    signal_data: Optional[Dict[str, Any]] = None

@app.on_event("startup")
def startup_db():
    init_db()

# API Endpoints
@app.post("/api/v1/verify-key")
def verify_api_key(req: KeyVerificationRequest):
    """Verify and save Market Data API key."""
    result = MarketDataProvider.validate_api_key(req.provider, req.api_key)
    if result["valid"]:
        save_setting("MARKET_DATA_PROVIDER", req.provider)
        save_setting("MARKET_DATA_API_KEY", req.api_key)
    return result

@app.get("/api/v1/key-status")
def get_key_status():
    """Get saved API key status."""
    provider = get_setting("MARKET_DATA_PROVIDER", "None")
    key = get_setting("MARKET_DATA_API_KEY", "")
    has_key = len(key) > 4
    masked_key = (key[:3] + "..." + key[-3:]) if len(key) > 6 else ("Active" if has_key else "None")
    return {
        "has_api_key": has_key,
        "provider": provider,
        "masked_key": masked_key
    }

@app.get("/api/v1/candles")
def get_candles(symbol: str = "XAUUSD", timeframe: str = "5m", limit: int = 100):
    """Fetch candlestick price series for chart rendering."""
    api_key = get_setting("MARKET_DATA_API_KEY", "")
    df = MarketDataProvider.fetch_candles(symbol=symbol, timeframe=timeframe, limit=limit, api_key=api_key)
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "candles": df.to_dict(orient="records")
    }

@app.post("/api/v1/analyze")
def analyze_market(req: AnalysisRequest):
    """Run Sentinel X Analysis Engine on live price data."""
    api_key = get_setting("MARKET_DATA_API_KEY", "")
    df = MarketDataProvider.fetch_candles(symbol=req.symbol, timeframe=req.timeframe, limit=100, api_key=api_key)
    
    engine = SentinelXEngine(
        account_balance=req.account_balance,
        risk_percent=req.risk_percent
    )
    
    result = engine.analyze(df, symbol=req.symbol, timeframe=req.timeframe)
    
    # If a valid setup signal is generated, save to database
    if result.get("signal", {}).get("has_signal", False):
        sig = result["signal"]
        save_signal({
            "symbol": req.symbol,
            "timeframe": req.timeframe,
            "direction": sig["direction"],
            "signal_type": sig["decision"],
            "entry_price": sig["entry_price"],
            "stop_loss": sig["stop_loss"],
            "take_profit": sig["take_profit"],
            "risk_reward": sig["risk_reward"],
            "score": result["score"],
            "grade": result["grade"],
            "recommended_lot": sig["recommended_lot"],
            "risk_amount": sig["projected_risk_usd"],
            "status": "ACTIVE",
            "entry_time": result["timestamp"],
            "notes": f"Regime: {result['regime']} | ADX: {result['indicators']['adx']} | RSI: {result['indicators']['rsi']}"
        })
        
    return result

@app.get("/api/v1/signals")
def list_signals(limit: int = 50):
    """Get list of past & active signals and win rate statistics."""
    signals = get_signals(limit=limit)
    stats = get_signal_stats()
    return {
        "stats": stats,
        "signals": signals
    }

@app.post("/api/v1/export-signal")
def export_signal(req: ExportSignalRequest):
    """Broadcast trade signal to Telegram channel or Webhook."""
    sig = req.signal_data
    if not sig:
        return {"status": "error", "message": "No signal payload provided."}
        
    msg = (
        f"🚨 <b>SENTINEL X TRADE SIGNAL</b> 🚨\n\n"
        f"<b>Asset:</b> {sig.get('symbol', 'XAUUSD')}\n"
        f"<b>Direction:</b> {sig.get('direction', 'LONG')}\n"
        f"<b>Decision:</b> {sig.get('decision', 'ENTRY')}\n"
        f"<b>Entry Price:</b> {sig.get('entry_price', 0.0)}\n"
        f"<b>Stop Loss:</b> {sig.get('stop_loss', 0.0)}\n"
        f"<b>Take Profit:</b> {sig.get('take_profit', 0.0)}\n"
        f"<b>Risk/Reward:</b> 1:{sig.get('risk_reward', 2.0)}\n"
        f"<b>Rec. Lot Size:</b> {sig.get('recommended_lot', 0.01)}\n"
        f"<b>Quality Score:</b> {sig.get('score', 0.0)} ({sig.get('grade', 'A')})\n\n"
        f"<i>Generated by Sentinel X Signal Provider</i>"
    )
    
    bot_token = req.telegram_bot_token or get_setting("TELEGRAM_BOT_TOKEN", "")
    chat_id = req.telegram_chat_id or get_setting("TELEGRAM_CHAT_ID", "")
    
    if bot_token and chat_id:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        try:
            res = requests.post(url, json={"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}, timeout=5).json()
            if res.get("ok"):
                return {"status": "success", "message": "Signal published to Telegram!"}
            else:
                return {"status": "error", "message": f"Telegram API error: {res.get('description')}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    return {"status": "success", "message": "Signal formatted for export!", "formatted_text": msg}

# Mount Frontend static directory
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
