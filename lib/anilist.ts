import AsyncStorage from '@react-native-async-storage/async-storage';

export const ANILIST_API = "https://graphql.anilist.co";

// Strip "(Source: ...)", "Note: ..." and similar attribution lines from AniList descriptions
export const cleanAnilistDescription = (desc: any): any => {
  if (!desc) return desc;
  let clean = desc
    .split("<")
    .map((chunk: string, i: number) =>
      i === 0 ? chunk : chunk.slice(chunk.indexOf(">") + 1),
    )
    .join("")
    .replace(/>/g, "");
  clean = clean.replace(/\(Source:[^)]*\)/gi, "");
  clean = clean.replace(/\bNote:[^\n]*/gi, "");
  clean = clean.replace(/[\s\n]+$/, "").trim();
  return clean;
};

const ANILIST_QUERY = `
query ($search: String, $type: MediaType) {
  Media(search: $search, type: $type, sort: SEARCH_MATCH) {
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large }
    bannerImage
    genres
    averageScore
    episodes
    status
    season
    seasonYear
    studios(isMain: true) { nodes { name } }
    startDate { year month }
    relations {
      edges {
        relationType
        node {
          id
          type
          format
          title { romaji english }
          episodes
          startDate { year month }
          seasonYear
        }
      }
    }
  }
}`;

// ── AniList cache (AsyncStorage + in-memory) ──────────────────────────────────
const ANILIST_CACHE_KEY = "streamflix_anilistCache";
const ANILIST_CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

let _anilistCache: any = null;

async function getAnilistCache(): Promise<any> {
  if (_anilistCache) return _anilistCache;
  try {
    const raw = await AsyncStorage.getItem(ANILIST_CACHE_KEY);
    _anilistCache = raw ? JSON.parse(raw) : {};
  } catch {
    _anilistCache = {};
  }
  const now = Date.now();
  for (const key of Object.keys(_anilistCache)) {
    if (now - _anilistCache[key].ts > ANILIST_CACHE_TTL) {
      delete _anilistCache[key];
    }
  }
  return _anilistCache;
}

let _anilistFlushTimer: any = null;
async function flushAnilistCache() {
  if (_anilistFlushTimer) clearTimeout(_anilistFlushTimer);
  _anilistFlushTimer = setTimeout(async () => {
    _anilistFlushTimer = null;
    try {
      await AsyncStorage.setItem(
        ANILIST_CACHE_KEY,
        JSON.stringify(_anilistCache),
      );
    } catch (e) {
      console.warn('flushAnilistCache failed', e);
    }
  }, 500);
}

export const fetchAnilistData = async (
  title: string,
  type: string = "ANIME",
  tmdbId: any = null,
): Promise<any> => {
  const cacheKey = tmdbId
    ? `${type}__tmdb_${tmdbId}`
    : `${type}__${title.toLowerCase().trim()}`;

  const cache = await getAnilistCache();
  const entry = cache[cacheKey];
  if (entry && Date.now() - entry.ts <= ANILIST_CACHE_TTL) {
    const cachedTitles = [
      entry.data?.title?.romaji,
      entry.data?.title?.english,
      entry.data?.title?.native,
    ]
      .filter(Boolean)
      .map((t: string) => t.toLowerCase());
    const searchTitle = title.toLowerCase();
    const isMismatch =
      entry.data !== null &&
      cachedTitles.length > 0 &&
      !cachedTitles.some(
        (t: string) => t.includes(searchTitle) || searchTitle.includes(t),
      );
    if (!isMismatch) return entry.data;
    delete cache[cacheKey];
    await flushAnilistCache();
  }

  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: { search: title, type },
      }),
    });
    const json = await res.json();
    const data = json?.data?.Media || null;

    cache[cacheKey] = { data, ts: Date.now() };
    await flushAnilistCache();

    return data;
  } catch (e) {
    console.warn('fetchAnilistData failed', e);
    if (entry) return entry.data;
    return null;
  }
};

export const buildAnilistSeasons = (anilistData: any): any => {
  if (!anilistData) return null;

  const main = {
    id: anilistData.id,
    title:
      anilistData.title?.english ||
      anilistData.title?.romaji ||
      anilistData.title?.native,
    episodes: anilistData.episodes || null,
    year: anilistData.startDate?.year || anilistData.seasonYear || 9999,
    month: anilistData.startDate?.month || 0,
  };

  const sequels = (anilistData.relations?.edges || [])
    .filter(
      (e: any) =>
        e.relationType === "SEQUEL" &&
        e.node.type === "ANIME" &&
        (e.node.format === "TV" || e.node.format === "TV_SHORT"),
    )
    .map((e: any) => ({
      id: e.node.id,
      title: e.node.title?.english || e.node.title?.romaji,
      episodes: e.node.episodes || null,
      year: e.node.startDate?.year || e.node.seasonYear || 9999,
      month: e.node.startDate?.month || 0,
    }));

  const all = [main, ...sequels].sort((a: any, b: any) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  );

  return all.map((s: any, i: number) => ({ seasonNum: i + 1, ...s }));
};

// ── AniList trending anime ─────────────────────────────────────────────────────
const ANILIST_TRENDING_QUERY = `
query ($page: Int) {
  Page(page: $page, perPage: 20) {
    media(sort: TRENDING_DESC, type: ANIME) {
      id
      idMal
      title { romaji english native }
      coverImage { extraLarge large }
      bannerImage
      genres
      averageScore
      episodes
      status
      season
      seasonYear
      startDate { year month }
      description
    }
  }
}`;

export const getAnilistTrending = async (page: number = 1): Promise<any[]> => {
  try {
    const res = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: ANILIST_TRENDING_QUERY,
        variables: { page },
      }),
    });
    const json = await res.json();
    const media = json?.data?.Page?.media || [];
    return media.map((m: any) => ({
      id: m.id,
      idMal: m.idMal,
      title: m.title,
      coverImage: m.coverImage,
      bannerImage: m.bannerImage,
      genres: m.genres,
      averageScore: m.averageScore,
      episodes: m.episodes,
      status: m.status,
      season: m.season,
      seasonYear: m.seasonYear,
      startDate: m.startDate,
      description: m.description,
      media_type: "anime",
    }));
  } catch (e) {
    console.warn('getAnilistTrending failed', e);
    return [];
  }
};
