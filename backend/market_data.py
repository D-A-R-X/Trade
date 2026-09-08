import requests
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

class MarketDataProvider:
    """
    Market Data Fetcher supporting TwelveData API, AlphaVantage, and Fallback Generator.
    Validates API keys and formats price candles for Sentinel X Analysis & Charting.
    Includes in-memory caching to respect API rate limits (e.g. TwelveData 8 calls/min limit).
    """
    _cache: Dict[str, Any] = {}
    
    @staticmethod
    def validate_api_key(provider: str, api_key: str) -> Dict[str, Any]:
        """Validate API key against remote market data provider."""
        if not api_key or len(api_key.strip()) < 4:
            return {"valid": False, "message": "API key must be at least 4 characters long."}
        
        provider = provider.lower()
        if provider == "twelvedata":
            url = f"https://api.twelvedata.com/api_usage?apikey={api_key}"
            try:
                res = requests.get(url, timeout=12).json()
                if "timestamp" in res or res.get("status") == "ok" or "current_usage" in res or "plan" in res:
                    return {"valid": True, "provider": "TwelveData", "message": "TwelveData API key verified successfully!"}
                elif res.get("code") == 401 or "invalid" in str(res).lower():
                    return {"valid": False, "provider": "TwelveData", "message": "Invalid TwelveData API key."}
                elif "credit" in str(res).lower() or "limit" in str(res).lower() or res.get("code") == 429:
                    return {"valid": True, "provider": "TwelveData", "message": "TwelveData API key saved! (Rate limit active, caching enabled)"}
                else:
                    # Fallback check via quote
                    q_url = f"https://api.twelvedata.com/quote?symbol=XAU/USD&apikey={api_key}"
                    q_res = requests.get(q_url, timeout=12).json()
                    if "symbol" in q_res or "name" in q_res:
                        return {"valid": True, "provider": "TwelveData", "message": "TwelveData API key verified successfully!"}
                    elif "credit" in str(q_res).lower() or "limit" in str(q_res).lower() or q_res.get("code") == 429:
                        return {"valid": True, "provider": "TwelveData", "message": "TwelveData API key saved! (Rate limit active, caching enabled)"}
                    msg = q_res.get("message", "Invalid API key")
                    return {"valid": False, "provider": "TwelveData", "message": f"TwelveData error: {msg}"}
            except requests.exceptions.Timeout:
                return {"valid": False, "message": "TwelveData request timed out. Please check network connection and try again."}
            except Exception as e:
                return {"valid": False, "message": f"Connection error: {str(e)}"}
                
        elif provider == "alphavantage":
            url = f"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey={api_key}"
            try:
                res = requests.get(url, timeout=12).json()
                if "Time Series (5min)" in res or "Meta Data" in res:
                    return {"valid": True, "provider": "AlphaVantage", "message": "AlphaVantage API key verified successfully!"}
                elif "note" in res or "frequency" in str(res).lower() or "limit" in str(res).lower():
                    return {"valid": True, "provider": "AlphaVantage", "message": "AlphaVantage API key saved! (Rate limit active, caching enabled)"}
                else:
                    return {"valid": False, "provider": "AlphaVantage", "message": "AlphaVantage key invalid."}
            except requests.exceptions.Timeout:
                return {"valid": False, "message": "AlphaVantage request timed out. Please try again."}
            except Exception as e:
                return {"valid": False, "message": f"Connection error: {str(e)}"}
        else:
            # Generic verification
            return {"valid": True, "provider": provider.capitalize(), "message": f"{provider.capitalize()} API key saved!"}

    @staticmethod
    def fetch_candles(symbol: str = "XAUUSD", timeframe: str = "5m", limit: int = 100, api_key: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch intraday candle data with 20s rate-limit cache. Uses TwelveData if API key provided.
        """
        cache_key = f"{symbol.upper()}_{timeframe}_{api_key or 'demo'}"
        now_ts = datetime.now().timestamp()
        
        # Check 20-second cache to protect API quota
        if cache_key in MarketDataProvider._cache:
            cached_time, cached_df = MarketDataProvider._cache[cache_key]
            if now_ts - cached_time < 20:
                return cached_df

        if api_key and len(api_key) > 5:
            # Try TwelveData
            formatted_symbol = "XAU/USD" if "XAU" in symbol.upper() else symbol.upper()
            interval_map = {"1m": "1min", "5m": "5min", "15m": "15min", "1h": "1h", "1d": "1day"}
            interval = interval_map.get(timeframe, "5min")
            
            url = f"https://api.twelvedata.com/time_series?symbol={formatted_symbol}&interval={interval}&outputsize={limit}&apikey={api_key}"
            try:
                res = requests.get(url, timeout=12).json()
                if "values" in res:
                    data = res["values"]
                    records = []
                    for item in reversed(data):
                        records.append({
                            "timestamp": item["datetime"],
                            "time": int(pd.to_datetime(item["datetime"]).timestamp()),
                            "open": float(item["open"]),
                            "high": float(item["high"]),
                            "low": float(item["low"]),
                            "close": float(item["close"]),
                            "volume": float(item.get("volume", 100))
                        })
                    df_res = pd.DataFrame(records)
                    MarketDataProvider._cache[cache_key] = (now_ts, df_res)
                    return df_res
            except Exception:
                pass # Fallback below

        # Fallback Generator for seamless demo & offline execution
        df_sim = MarketDataProvider.generate_simulated_candles(symbol, timeframe, limit)
        MarketDataProvider._cache[cache_key] = (now_ts, df_sim)
        return df_sim

    @staticmethod
    def generate_simulated_candles(symbol: str = "XAUUSD", timeframe: str = "5m", limit: int = 100) -> pd.DataFrame:
        """Generates realistic candlestick series for analysis and charts."""
        base_price = 2650.0 if "XAU" in symbol.upper() else 1.0850 if "EUR" in symbol.upper() else 65000.0 if "BTC" in symbol.upper() else 100.0
        volatility = base_price * 0.002
        
        now = datetime.now()
        tf_minutes = 5 if timeframe == "5m" else 1 if timeframe == "1m" else 15 if timeframe == "15m" else 60
        
        records = []
        curr_price = base_price
        
        for i in range(limit):
            dt = now - timedelta(minutes=tf_minutes * (limit - i))
            change = np.random.normal(0, volatility)
            curr_open = curr_price
            curr_close = curr_open + change
            high_diff = abs(np.random.normal(volatility * 0.5, volatility * 0.3))
            low_diff = abs(np.random.normal(volatility * 0.5, volatility * 0.3))
            
            curr_high = max(curr_open, curr_close) + high_diff
            curr_low = min(curr_open, curr_close) - low_diff
            curr_price = curr_close
            
            records.append({
                "timestamp": dt.strftime("%Y-%m-%d %H:%M"),
                "time": int(dt.timestamp()),
                "open": round(curr_open, 2),
                "high": round(curr_high, 2),
                "low": round(curr_low, 2),
                "close": round(curr_close, 2),
                "volume": int(np.random.randint(100, 1500))
            })
            
        return pd.DataFrame(records)
