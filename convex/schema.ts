import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Real-time Trade Signals table synced across Web & Sentinel X App
  signals: defineTable({
    symbol: v.string(),
    timeframe: v.string(),
    direction: v.string(), // LONG, SHORT, NEUTRAL
    signalType: v.string(), // BUY SIGNAL, PREP LONG, etc.
    entryPrice: v.number(),
    stopLoss: v.number(),
    takeProfit: v.number(),
    riskReward: v.number(),
    score: v.number(),
    grade: v.string(), // A+, A, B, C, F
    recommendedLot: v.number(),
    riskAmount: v.number(),
    status: v.string(), // ACTIVE, WIN, LOSS, CANCELLED
    entryTime: v.string(),
    createdAt: v.number(),
    notes: v.optional(v.string()),
  }).index("by_symbol", ["symbol"])
    .index("by_status", ["status"]),

  // Real-time Market Regime Analysis state
  analysis: defineTable({
    symbol: v.string(),
    timeframe: v.string(),
    timestamp: v.string(),
    currentPrice: v.number(),
    regime: v.string(), // TRENDING BULL, TRENDING BEAR, RANGING, BREAKOUT
    direction: v.string(),
    decision: v.string(),
    score: v.number(),
    longScore: v.number(),
    shortScore: v.number(),
    grade: v.string(),
    indicators: v.object({
      ema20: v.number(),
      ema50: v.number(),
      atr: v.number(),
      rsi: v.number(),
      adx: v.number(),
    }),
    updatedAt: v.number(),
  }).index("by_symbol_tf", ["symbol", "timeframe"]),

  // User Settings & Sync API Keys
  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
