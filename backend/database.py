import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "signals.db")

def init_db(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Table for storing user configuration & API keys
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Table for storing generated trade signals
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trade_signals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            timeframe TEXT NOT NULL,
            direction TEXT NOT NULL,
            signal_type TEXT NOT NULL,
            entry_price REAL NOT NULL,
            stop_loss REAL NOT NULL,
            take_profit REAL NOT NULL,
            risk_reward REAL NOT NULL,
            score REAL NOT NULL,
            grade TEXT NOT NULL,
            recommended_lot REAL NOT NULL,
            risk_amount REAL NOT NULL,
            status TEXT DEFAULT 'ACTIVE',
            entry_time TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            result TEXT DEFAULT 'PENDING',
            notes TEXT
        )
    """)
    
    conn.commit()
    conn.close()

def save_setting(key: str, value: str, db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    """, (key, value))
    conn.commit()
    conn.close()

def get_setting(key: str, default: Optional[str] = None, db_path: str = DB_PATH) -> Optional[str]:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else default

def save_signal(signal_data: Dict[str, Any], db_path: str = DB_PATH) -> int:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trade_signals (
            symbol, timeframe, direction, signal_type, entry_price, stop_loss,
            take_profit, risk_reward, score, grade, recommended_lot, risk_amount,
            status, entry_time, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        signal_data.get("symbol", "XAUUSD"),
        signal_data.get("timeframe", "5m"),
        signal_data.get("direction", "LONG"),
        signal_data.get("signal_type", "SETUP"),
        signal_data.get("entry_price", 0.0),
        signal_data.get("stop_loss", 0.0),
        signal_data.get("take_profit", 0.0),
        signal_data.get("risk_reward", 2.0),
        signal_data.get("score", 0.0),
        signal_data.get("grade", "C"),
        signal_data.get("recommended_lot", 0.01),
        signal_data.get("risk_amount", 10.0),
        signal_data.get("status", "ACTIVE"),
        signal_data.get("entry_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        signal_data.get("notes", "")
    ))
    signal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return signal_id

def get_signals(limit: int = 50, db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trade_signals ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_signal_stats(db_path: str = DB_PATH) -> Dict[str, Any]:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN result='WIN' THEN 1 ELSE 0 END), SUM(CASE WHEN result='LOSS' THEN 1 ELSE 0 END) FROM trade_signals")
    total, wins, losses = cursor.fetchone()
    conn.close()
    
    total = total or 0
    wins = wins or 0
    losses = losses or 0
    win_rate = (wins / total * 100) if total > 0 else 0.0
    
    return {
        "total_signals": total,
        "wins": wins,
        "losses": losses,
        "win_rate": round(win_rate, 1)
    }

init_db()
