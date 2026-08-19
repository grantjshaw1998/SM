import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTmdbLanguage } from './storage';

export const TMDB_BASE = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";

export const imgUrl = (path: any, size: string = "w500") =>
  path ? `${IMG_BASE}/${size}${path}` : null;

// ── In-memory TMDB response cache (session-scoped) ────────────────────────────
// TTL: 5 minutes
const _tmdbCache = new Map();
const TMDB_CACHE_TTL = 5 * 60 * 1000;

export function clearTmdbCache() {
  _tmdbCache.clear();
}

// ── Request queue (max 4 concurrent TMDB fetches) ────────────────────────────
let _inflight = 0;
const MAX_INFLIGHT = 4;
const _waiters: Array<() => void> = [];

function _acquireSlot(): Promise<void> {
  if (_inflight < MAX_INFLIGHT) {
    _inflight++;
    return Promise.resolve();
  }
  return new Promise((resolve) => _waiters.push(resolve));
}

function _releaseSlot() {
  _inflight--;
  if (_waiters.length > 0) {
    _inflight++;
    _waiters.shift()!();
  }
}

// Append the language query param to a TMDB path.
function withLanguage(path: string): string {
  const lang = "language=" + encodeURIComponent(getTmdbLanguageSync());
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${lang}`;
}

// getTmdbLanguage is async (AsyncStorage); keep a synchronous snapshot for the
// request hot path and refresh it lazily. We initialize from a cached value.
let _langSnapshot = "en-US";
getTmdbLanguage().then((l) => {
  _langSnapshot = l;
});
function getTmdbLanguageSync(): string {
  return _langSnapshot;
}
// Allow callers to refresh the snapshot after changing language.
export const refreshTmdbLanguage = async (): Promise<void> => {
  _langSnapshot = await getTmdbLanguage();
};

export const tmdbFetch = async (path: string, apiKey: string, opts?: any): Promise<any> => {
  const localizedPath = withLanguage(path);
  const cacheKey = `${apiKey}|${localizedPath}`;
  const cached = _tmdbCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  await _acquireSlot();

  let res: Response;
  try {
    res = await fetch(`${TMDB_BASE}${localizedPath}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      ...(opts || {}),
    });
  } catch (e) {
    _releaseSlot();
    throw new Error("TMDB unreachable");
  }

  _releaseSlot();

  if (res.status === 401 || res.status === 403) {
    throw new Error(`TMDB ${res.status}`);
  }

  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  _tmdbCache.set(cacheKey, { data, expiresAt: Date.now() + TMDB_CACHE_TTL });

  // Evict stale entries to prevent unbounded memory growth
  if (_tmdbCache.size > 80) {
    const now = Date.now();
    for (const [k, v] of _tmdbCache) {
      if (now >= v.expiresAt) _tmdbCache.delete(k);
    }
  }

  return data;
};

export const getTrending = (
  mediaType: string = "all",
  apiKey: string,
  page: number = 1,
): Promise<any> =>
  tmdbFetch(`/trending/${mediaType}/week?page=${page}`, apiKey);

export const getTopRated = (
  mediaType: string,
  apiKey: string,
  page: number = 1,
): Promise<any> => tmdbFetch(`/${mediaType}/top_rated?page=${page}`, apiKey);

export const getDetails = (
  id: any,
  mediaType: string,
  apiKey: string,
): Promise<any> => tmdbFetch(`/${mediaType}/${id}`, apiKey);

export const getCredits = (
  id: any,
  mediaType: string,
  apiKey: string,
): Promise<any> => tmdbFetch(`/${mediaType}/${id}/credits`, apiKey);

export const getSeasonEpisodes = (
  id: any,
  season: any,
  apiKey: string,
): Promise<any> => tmdbFetch(`/tv/${id}/season/${season}`, apiKey);

export const getRecommendations = (
  id: any,
  mediaType: string,
  apiKey: string,
): Promise<any> => tmdbFetch(`/${mediaType}/${id}/recommendations`, apiKey);

export const searchMulti = (
  query: string,
  apiKey: string,
  page: number = 1,
): Promise<any> =>
  tmdbFetch(
    `/search/multi?query=${encodeURIComponent(query)}&page=${page}`,
    apiKey,
  );

// TMDB genre ID 16 = Animation. Treat it as anime when origin_country includes JP or language is ja
export const isAnimeContent = (item: any, details: any): boolean => {
  const d = details || item;
  const lang = d?.original_language;
  const countries = d?.origin_country || [];
  const genreIds = d?.genre_ids || (d?.genres || []).map((g: any) => g.id);
  const hasAnimation = Array.isArray(genreIds) ? genreIds.includes(16) : false;
  return hasAnimation && (lang === "ja" || countries.includes("JP"));
};

// ── Player Sources ────────────────────────────────────────────────────────────
export const PLAYER_SOURCES = [
  {
    id: "videasy",
    label: "Videasy",
    tag: null,
    note: null,
    supportsProgress: true,
    colorParam: "color",
    langParam: null,
    params: {
      overlay: "true",
    },
    movieUrl: (id: any) => `https://player.videasy.to/movie/${id}`,
    tvUrl: (id: any, season: any, ep: any) =>
      `https://player.videasy.to/tv/${id}/${season}/${ep}`,
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    tag: null,
    note: null,
    supportsProgress: true,
    progressViaFrames: true,
    colorParam: null,
    langParam: "ds_lang",
    params: {},
    movieUrl: (id: any) => `https://vsembed.su/embed/movie/${id}`,
    tvUrl: (id: any, season: any, ep: any) =>
      `https://vsembed.su/embed/tv/${id}/${season}/${ep}`,
  },
  {
    id: "vidking",
    label: "Vidking",
    tag: null,
    note: null,
    supportsProgress: true,
    colorParam: "color",
    langParam: null,
    params: {
      autoPlay: "true",
    },
    movieUrl: (id: any) => `https://www.vidking.net/embed/movie/${id}`,
    tvUrl: (id: any, season: any, ep: any) =>
      `https://www.vidking.net/embed/tv/${id}/${season}/${ep}`,
  },
  {
    id: "allmanga",
    label: "AllManga",
    tag: "ANIME",
    note: null,
    supportsProgress: true,
    async: true,
    params: {},
    movieUrl: (_id: any) => "https://allmanga.to",
    tvUrl: (_id: any, _season: any, _ep: any) => "https://allmanga.to",
  },
];

export const getSourceUrl = (
  sourceId: string,
  type: string,
  id: any,
  season: any,
  ep: any,
  extraParams: any = {},
  accentColor: string | null = null,
  subtitleLang: string | null = null,
): string => {
  const src =
    PLAYER_SOURCES.find((s) => s.id === sourceId) ?? PLAYER_SOURCES[0];
  const baseUrl =
    type === "movie" ? src.movieUrl(id) : src.tvUrl(id, season, ep);
  const url = new URL(baseUrl);

  Object.entries(src.params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });

  if (accentColor && src.colorParam) {
    url.searchParams.set(src.colorParam, accentColor.replace(/^#/, ""));
  }

  if (subtitleLang && src.langParam) {
    url.searchParams.set(src.langParam, subtitleLang);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export const sourceSupportsProgress = (sourceId: string): boolean =>
  PLAYER_SOURCES.find((s) => s.id === sourceId)?.supportsProgress ?? false;

export const sourceProgressViaFrames = (sourceId: string): boolean =>
  PLAYER_SOURCES.find((s) => s.id === sourceId)?.progressViaFrames ?? false;

export const sourceIsAsync = (sourceId: string): boolean =>
  PLAYER_SOURCES.find((s) => s.id === sourceId)?.async ?? false;

export const getNextNonAsyncSource = (currentId: string): string | null => {
  const nonAsync = PLAYER_SOURCES.filter((s) => !s.async);
  if (nonAsync.length === 0) return null;
  const idx = nonAsync.findIndex((s) => s.id === currentId);
  if (idx < 0) return nonAsync[0].id;
  return nonAsync[(idx + 1) % nonAsync.length].id;
};

export const NEEDS_INTERCEPT = ["vidsrc"];

// Default sources
export const ANIME_DEFAULT_SOURCE = "allmanga";
export const NON_ANIME_DEFAULT_SOURCE = "vidking";

// ── Episode Group fetch (AsyncStorage + in-memory cache, 7-day TTL) ─────────
const EG_CACHE_KEY = "streamflix_episodeGroupCache";
const EG_CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

let _egCache: any = null;

async function getEgCache(): Promise<any> {
  if (_egCache) return _egCache;
  try {
    const raw = await AsyncStorage.getItem(EG_CACHE_KEY);
    _egCache = raw ? JSON.parse(raw) : {};
  } catch {
    _egCache = {};
  }
  const now = Date.now();
  for (const key of Object.keys(_egCache)) {
    if (now - _egCache[key].ts > EG_CACHE_TTL) delete _egCache[key];
  }
  return _egCache;
}

let _egFlushTimer: any = null;
async function flushEgCache() {
  if (_egFlushTimer) clearTimeout(_egFlushTimer);
  _egFlushTimer = setTimeout(async () => {
    _egFlushTimer = null;
    try {
      await AsyncStorage.setItem(EG_CACHE_KEY, JSON.stringify(_egCache));
    } catch (e) {
      console.warn('flushEgCache failed', e);
    }
  }, 500);
}

export const fetchEpisodeGroup = async (
  groupId: string,
  apiKey: string,
): Promise<any> => {
  const cache = await getEgCache();
  const entry = cache[groupId];
  if (entry && Date.now() - entry.ts <= EG_CACHE_TTL) return entry.data;

  const data = await tmdbFetch(`/tv/episode_group/${groupId}`, apiKey);
  cache[groupId] = { data, ts: Date.now() };
  await flushEgCache();
  return data;
};
