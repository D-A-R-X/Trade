import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get latest analysis for symbol and timeframe
export const getLatestAnalysis = query({
  args: {
    symbol: v.string(),
    timeframe: v.string(),
  },
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("analysis")
      .withIndex("by_symbol_tf", (q) =>
        q.eq("symbol", args.symbol).eq("timeframe", args.timeframe)
      )
      .first();
    return analysis;
  },
});

// Mutation: Update live market analysis state
export const updateAnalysis = mutation({
  args: {
    symbol: v.string(),
    timeframe: v.string(),
    timestamp: v.string(),
    currentPrice: v.number(),
    regime: v.string(),
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("analysis")
      .withIndex("by_symbol_tf", (q) =>
        q.eq("symbol", args.symbol).eq("timeframe", args.timeframe)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("analysis", {
        ...args,
        updatedAt: Date.now(),
      });
      return id;
    }
  },
});
