import { z } from "zod";

export const eventSchema = z.object({
  _id: z.string().optional(),
  slug: z.string().min(2),
  title: z.string().min(2),
  subtitle: z.string().min(2),
  description: z.string().min(2),
  status: z.enum(["draft", "published", "archived"]),
  startsAt: z.string(),
  endsAt: z.string(),
  location: z.string().min(2),
  coverImage: z.string().min(1),
  logoImage: z.string().min(1),
  streamUrl: z.string().optional().or(z.literal("")),
  qrUrl: z.string().optional(),
  categories: z.array(z.string()),
  teams: z.array(z.any()),
  matches: z.array(z.any()),
  rankingColumns: z.array(z.string()).optional(),
  rankings: z.array(z.any()),
  media: z.array(z.any()),
  feed: z.array(z.any()),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const commentSchema = z.object({
  eventId: z.string().min(1),
  targetType: z.enum(["event", "feed", "media"]),
  targetId: z.string().min(1),
  body: z.string().min(1).max(1200),
  authorName: z.string().min(1).optional(),
  authorEmail: z.string().email().optional(),
  authorImage: z.string().optional()
});
