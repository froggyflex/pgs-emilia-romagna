export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";

export type EventStatus = "draft" | "updating" | "published" | "archived";

export type EventSectionType = "campionato" | "intrattenimento";

export type ProgramItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
};

export type EventSection = {
  id: string;
  slug: string;
  type: EventSectionType;
  title: string;
  subtitle?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  heroImage?: string;
  programItems?: ProgramItem[];
};

export type Team = {
  id: string;
  name: string;
  category: string;
  city?: string;
};

export type EventField = {
  id: string;
  name: string;
  address: string;
  mapUrl?: string;
};

export type Match = {
  id: string;
  sectionId?: string;
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
  sectionId?: string;
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
  sectionId?: string;
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
  sectionId?: string;
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
  sections?: EventSection[];
  categories: string[];
  fields?: EventField[];
  teams: Team[];
  matches: Match[];
  rankingColumns?: string[];
  rankings: RankingRow[];
  media: MediaItem[];
  feed: FeedPost[];
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsCount = {
  label: string;
  count: number;
  percent: number;
};

export type RecentVisit = {
  id: string;
  path: string;
  country: string;
  region?: string;
  city?: string;
  device: string;
  createdAt: string;
};

export type AnalyticsSummary = {
  totalVisits: number;
  visitsToday: number;
  visitsLast7Days: number;
  generatedAt: string;
  countries: AnalyticsCount[];
  regions: AnalyticsCount[];
  cities: AnalyticsCount[];
  paths: AnalyticsCount[];
  devices: AnalyticsCount[];
  recent: RecentVisit[];
};
