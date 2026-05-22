export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export type EventStatus = "draft" | "published" | "archived";

export type Team = {
  id: string;
  name: string;
  category: string;
  city?: string;
};

export type Match = {
  id: string;
  category: string;
  homeTeam: string;
  awayTeam: string;
  court: string;
  startsAt: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  streamUrl?: string;
  notes?: string;
};

export type RankingRow = {
  id: string;
  category: string;
  team: string;
  played: number;
  wins: number;
  losses: number;
  points: number;
  setRatio?: string;
  values?: Record<string, string>;
};

export type MediaItem = {
  id: string;
  type: "photo" | "video";
  title: string;
  url: string;
  caption?: string;
  commentsEnabled: boolean;
  likes?: number;
  authorName?: string;
  authorEmail?: string;
  authorImage?: string;
  createdAt: string;
};

export type FeedPost = {
  id: string;
  eventId: string;
  title: string;
  body: string;
  type: "announcement" | "ranking" | "media" | "live";
  mediaUrl?: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  eventId: string;
  targetType: "event" | "feed" | "media";
  targetId: string;
  authorName: string;
  authorEmail: string;
  authorImage?: string;
  body: string;
  hidden: boolean;
  createdAt: string;
};

export type EventRecord = {
  _id?: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  status: EventStatus;
  startsAt: string;
  endsAt: string;
  location: string;
  coverImage: string;
  logoImage: string;
  streamUrl?: string;
  qrUrl?: string;
  categories: string[];
  teams: Team[];
  matches: Match[];
  rankingColumns?: string[];
  rankings: RankingRow[];
  media: MediaItem[];
  feed: FeedPost[];
  createdAt: string;
  updatedAt: string;
};
