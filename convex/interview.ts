import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    clerkId: v.string(),
    interviewType: v.string(),
    difficulty: v.string(),
    language: v.string(),
    duration: v.number(),
    keyConcepts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", args.clerkId)).first();
    if (!user) {
      throw new Error(`No user found with clerkId: ${args.clerkId}`);
    }

    const id = await ctx.db.insert("interviews", {
      userid: user._id,
      interviewType: args.interviewType,
      difficulty: args.difficulty,
      language: args.language,
      duration: args.duration,
      keyConcepts: args.keyConcepts,
    });
    return id;
  }
});

export const getInterviewData = query({
  args: { id: v.id("interviews") },
  handler: async (ctx, args) => {
    const interview = await ctx.db.get(args.id);
    if (!interview) {
      throw new Error(`No interview found with id: ${args.id}`);
    }
    return interview;
  }
});


