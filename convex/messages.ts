import { mutation, query } from './_generated/server';
import { v } from "convex/values";

// Query to get all messages from the "messages" table
export const getMessages = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  }
});

// Mutation to insert a new message into the "messages" table
export const storeMessage = mutation({
  args: {
    id: v.string(),
    text: v.string(),
    isUser: v.boolean(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("messages", {
      id: args.id,
      text: args.text,
      isUser: args.isUser,
    });
    return id;
  }
});
