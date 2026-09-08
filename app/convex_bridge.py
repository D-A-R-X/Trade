import os
import requests

CONVEX_URL = os.environ.get("CONVEX_URL", "")

class ConvexBridge:
    """
    Python Bridge Helper connecting Python FastAPI Heavy Backend to Convex Cloud Functions.
    Pushes real-time mutations for signals, market analysis, and user settings.
    """
    
    @staticmethod
    def push_signal(signal_data: dict) -> bool:
        """Push a newly generated trade signal to Convex for instant app sync."""
        url = os.environ.get("CONVEX_URL", "")
        if not url:
            return False
            
        endpoint = f"{url.rstrip('/')}/api/mutation"
        payload = {
            "path": "signals:publishSignal",
            "args": {
                "symbol": signal_data.get("symbol", "XAUUSD"),
                "timeframe": signal_data.get("timeframe", "5m"),
                "direction": signal_data.get("direction", "LONG"),
                "signalType": signal_data.get("signal_type", "SETUP"),
                "entryPrice": float(signal_data.get("entry_price", 0.0)),
                "stopLoss": float(signal_data.get("stop_loss", 0.0)),
                "takeProfit": float(signal_data.get("take_profit", 0.0)),
                "riskReward": float(signal_data.get("risk_reward", 2.0)),
                "score": float(signal_data.get("score", 0.0)),
                "grade": signal_data.get("grade", "A"),
                "recommendedLot": float(signal_data.get("recommended_lot", 0.01)),
                "riskAmount": float(signal_data.get("risk_amount", 10.0)),
                "entryTime": signal_data.get("entry_time", ""),
                "notes": signal_data.get("notes", "")
            }
        }
        try:
            res = requests.post(endpoint, json=payload, timeout=3)
            return res.status_code == 200
        except Exception:
            return False

    @staticmethod
    def push_analysis(analysis_data: dict) -> bool:
        """Push live market regime analysis state to Convex."""
        url = os.environ.get("CONVEX_URL", "")
        if not url:
            return False
            
        endpoint = f"{url.rstrip('/')}/api/mutation"
        payload = {
            "path": "analysis:updateAnalysis",
            "args": {
                "symbol": analysis_data.get("symbol", "XAUUSD"),
                "timeframe": analysis_data.get("timeframe", "5m"),
                "timestamp": analysis_data.get("timestamp", ""),
                "currentPrice": float(analysis_data.get("current_price", 0.0)),
                "regime": analysis_data.get("regime", "UNKNOWN"),
                "direction": analysis_data.get("direction", "NEUTRAL"),
                "decision": analysis_data.get("decision", "WAIT"),
                "score": float(analysis_data.get("score", 0.0)),
                "longScore": float(analysis_data.get("long_score", 0.0)),
                "shortScore": float(analysis_data.get("short_score", 0.0)),
                "grade": analysis_data.get("grade", "C"),
                "indicators": {
                    "ema20": float(analysis_data.get("indicators", {}).get("ema_20", 0.0)),
                    "ema50": float(analysis_data.get("indicators", {}).get("ema_50", 0.0)),
                    "atr": float(analysis_data.get("indicators", {}).get("atr", 0.0)),
                    "rsi": float(analysis_data.get("indicators", {}).get("rsi", 50.0)),
                    "adx": float(analysis_data.get("indicators", {}).get("adx", 20.0)),
                }
            }
        }
        try:
            res = requests.post(endpoint, json=payload, timeout=3)
            return res.status_code == 200
        except Exception:
            return False
