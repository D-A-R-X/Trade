import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Fetch all trade signals sorted by latest
export const listSignals = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const signals = await ctx.db
      .query("signals")
      .order("desc")
      .take(limit);
    return signals;
  },
});

// Query: Fetch only active trade signals
export const listActiveSignals = query({
  args: {},
  handler: async (ctx) => {
    const signals = await ctx.db
      .query("signals")
      .withIndex("by_status", (q) => q.eq("status", "ACTIVE"))
      .order("desc")
      .take(20);
    return signals;
  },
});

// Mutation: Broadcast new trade signal to all apps & clients
export const publishSignal = mutation({
  args: {
    symbol: v.string(),
    timeframe: v.string(),
    direction: v.string(),
    signalType: v.string(),
    entryPrice: v.number(),
    stopLoss: v.number(),
    takeProfit: v.number(),
    riskReward: v.number(),
    score: v.number(),
    grade: v.string(),
    recommendedLot: v.number(),
    riskAmount: v.number(),
    entryTime: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const signalId = await ctx.db.insert("signals", {
      ...args,
      status: "ACTIVE",
      createdAt: Date.now(),
    });
    return signalId;
  },
});

// Mutation: Update signal outcome (WIN/LOSS/CANCELLED)
export const updateSignalStatus = mutation({
  args: {
    signalId: v.id("signals"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.signalId, { status: args.status });
  },
});
