import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
// import { mutation, query } from "./_generated/server";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
  }).index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"]),
  interviews: defineTable({
    clerkId: v.id("users"),
    interviewType: v.string(),
    difficulty: v.string(),
    language: v.string(),
    duration: v.number(),
    keyConcepts: v.array(v.string()),
  }),
  messages: defineTable({
    id: v.string(),
    text: v.string(),
    isUser: v.boolean(),
  }), 
})

