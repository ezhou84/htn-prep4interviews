import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    interviewType: v.string(),
    difficulty: v.string(),
    language: v.string(),
    duration: v.number(),
    keyConcepts: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("interviews", {
      interviewType: args.interviewType,
      difficulty: args.difficulty,
      language: args.language,
      duration: args.duration,
      keyConcepts: args.keyConcepts,
    });
    return id;
  }
});
