import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from datetime import datetime

class SentinelXEngine:
    """
    Python Implementation of the Sentinel X Intraday Market Regime & Signal Engine.
    Ported from Pine Script v5 sentinel_x_intraday_engine_v1.pine.
    """
    
    def __init__(self, 
                 ema_fast_len: int = 20,
                 ema_slow_len: int = 50,
                 adx_len: int = 14,
                 atr_len: int = 14,
                 rsi_len: int = 14,
                 account_balance: float = 10000.0,
                 risk_percent: float = 1.0):
        self.ema_fast_len = ema_fast_len
        self.ema_slow_len = ema_slow_len
        self.adx_len = adx_len
        self.atr_len = atr_len
        self.rsi_len = rsi_len
        self.account_balance = account_balance
        self.risk_percent = risk_percent

    def analyze(self, df: pd.DataFrame, symbol: str = "XAUUSD", timeframe: str = "5m") -> Dict[str, Any]:
        """
        Analyze candlestick DataFrame (columns: open, high, low, close, volume, timestamp)
        and return full Sentinel X regime, score, grade, and trade signals.
        """
        if len(df) < 50:
            return {"error": "Not enough data points for analysis (minimum 50 required)"}
        
        df = df.copy()
        close = df['close'].values
        high = df['high'].values
        low = df['low'].values
        open_p = df['open'].values
        volume = df['volume'].values if 'volume' in df else np.ones(len(df))

        # 1. Technical Indicators
        df['ema_fast'] = df['close'].ewm(span=self.ema_fast_len, adjust=False).mean()
        df['ema_slow'] = df['close'].ewm(span=self.ema_slow_len, adjust=False).mean()
        
        # ATR Calculation
        tr1 = df['high'] - df['low']
        tr2 = (df['high'] - df['close'].shift(1)).abs()
        tr3 = (df['low'] - df['close'].shift(1)).abs()
        df['tr'] = np.maximum(tr1, np.maximum(tr2, tr3))
        df['atr'] = df['tr'].rolling(window=self.atr_len).mean()
        df['atr_avg'] = df['atr'].rolling(window=50).mean()
        
        # RSI Calculation
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=self.rsi_len).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=self.rsi_len).mean()
        rs = gain / np.maximum(loss, 1e-9)
        df['rsi'] = 100 - (100 / (1 + rs))

        # ADX Calculation
        up_move = df['high'].diff()
        down_move = -df['low'].diff()
        plus_dm = np.where((up_move > down_move) & (up_move > 0), up_move, 0.0)
        minus_dm = np.where((down_move > up_move) & (down_move > 0), down_move, 0.0)
        
        plus_di = 100 * (pd.Series(plus_dm).rolling(self.adx_len).mean() / np.maximum(df['atr'], 1e-9))
        minus_di = 100 * (pd.Series(minus_dm).rolling(self.adx_len).mean() / np.maximum(df['atr'], 1e-9))
        dx = 100 * (np.abs(plus_di - minus_di) / np.maximum(plus_di + minus_di, 1e-9))
        df['adx'] = pd.Series(dx).rolling(self.adx_len).mean()

        # Latest values
        curr_close = close[-1]
        curr_open = open_p[-1]
        curr_high = high[-1]
        curr_low = low[-1]
        curr_ema_fast = df['ema_fast'].iloc[-1]
        curr_ema_slow = df['ema_slow'].iloc[-1]
        curr_atr = df['atr'].iloc[-1] if not np.isnan(df['atr'].iloc[-1]) else 1.0
        curr_rsi = df['rsi'].iloc[-1] if not np.isnan(df['rsi'].iloc[-1]) else 50.0
        curr_adx = df['adx'].iloc[-1] if not np.isnan(df['adx'].iloc[-1]) else 20.0

        # 2. Candle Dynamics & Impulse
        body = abs(curr_close - curr_open)
        candle_range = curr_high - curr_low
        body_atr_ratio = body / max(curr_atr, 1e-6)
        
        is_bull_close = curr_close > curr_open
        is_bear_close = curr_close < curr_open
        strong_bull_impulse = is_bull_close and (body_atr_ratio >= 1.2)
        strong_bear_impulse = is_bear_close and (body_atr_ratio >= 1.2)

        # 3. Market Regime & Trend State
        ema_bull = curr_close > curr_ema_fast and curr_ema_fast > curr_ema_slow
        ema_bear = curr_close < curr_ema_fast and curr_ema_fast < curr_ema_slow
        
        if curr_adx >= 22.0:
            regime = "TRENDING BULL" if ema_bull else "TRENDING BEAR" if ema_bear else "BREAKOUT"
        else:
            regime = "RANGING"

        # 4. Score Calculation (0-100)
        long_score = 0.0
        short_score = 0.0

        # Trend alignment (40 pts)
        if ema_bull:
            long_score += 40.0
        elif ema_bear:
            short_score += 40.0
        else:
            long_score += 15.0
            short_score += 15.0

        # Momentum & ADX (30 pts)
        if curr_adx >= 20.0:
            if is_bull_close:
                long_score += 20.0
            else:
                short_score += 20.0
        
        if curr_rsi > 50:
            long_score += 10.0
        else:
            short_score += 10.0

        # Impulse & Structure (30 pts)
        if strong_bull_impulse:
            long_score += 30.0
        elif strong_bear_impulse:
            short_score += 30.0
        else:
            long_score += 10.0
            short_score += 10.0

        # Grade Assignment
        max_score = max(long_score, short_score)
        if max_score >= 80:
            grade = "A+"
        elif max_score >= 70:
            grade = "A"
        elif max_score >= 55:
            grade = "B"
        elif max_score >= 40:
            grade = "C"
        else:
            grade = "F"

        # 5. Signal & Level Generation
        direction = "LONG" if long_score > short_score else "SHORT" if short_score > long_score else "NEUTRAL"
        
        pip_size = 0.10 if ("XAU" in symbol.upper() or "GOLD" in symbol.upper()) else 0.0001
        sl_distance = max(curr_atr * 1.5, pip_size * 20)
        
        if direction == "LONG":
            entry_price = curr_close
            stop_loss = entry_price - sl_distance
            take_profit = entry_price + (sl_distance * 2.0)
            valid_setup = long_score >= 55.0
            decision = "LONG" if valid_setup else "BUY ZONE" if long_score >= 45.0 else "WAIT"
        elif direction == "SHORT":
            entry_price = curr_close
            stop_loss = entry_price + sl_distance
            take_profit = entry_price - (sl_distance * 2.0)
            valid_setup = short_score >= 55.0
            decision = "SHORT" if valid_setup else "SELL ZONE" if short_score >= 45.0 else "WAIT"
        else:
            entry_price = curr_close
            stop_loss = curr_close - sl_distance
            take_profit = curr_close + sl_distance * 2.0
            valid_setup = False
            decision = "WAIT"

        risk_reward = 2.0
        risk_amount = self.account_balance * (self.risk_percent / 100.0)
        
        # Position Sizing
        pip_risk = sl_distance / pip_size
        if "XAU" in symbol.upper() or "GOLD" in symbol.upper():
            # For XAUUSD 1 lot = $100 per $1 move
            recommended_lot = max(0.01, round(risk_amount / (sl_distance * 100.0), 2))
        else:
            recommended_lot = max(0.01, round(risk_amount / (pip_risk * 10.0), 2))

        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "current_price": round(curr_close, 2),
            "regime": regime,
            "direction": direction,
            "decision": decision,
            "score": round(max_score, 1),
            "long_score": round(long_score, 1),
            "short_score": round(short_score, 1),
            "grade": grade,
            "indicators": {
                "ema_20": round(curr_ema_fast, 2),
                "ema_50": round(curr_ema_slow, 2),
                "atr": round(curr_atr, 2),
                "rsi": round(curr_rsi, 1),
                "adx": round(curr_adx, 1)
            },
            "signal": {
                "has_signal": valid_setup,
                "direction": direction,
                "decision": decision,
                "entry_price": round(entry_price, 2),
                "stop_loss": round(stop_loss, 2),
                "take_profit": round(take_profit, 2),
                "risk_reward": risk_reward,
                "risk_pips": round(pip_risk, 1),
                "recommended_lot": recommended_lot,
                "projected_risk_usd": round(risk_amount, 2)
            }
        }
