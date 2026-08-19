// ── AllManga (allmanga.to) best-effort resolvers ──────────────────────────────
// Simplified port of streambert's allmanga.js. We only resolve a slug/page URL
// and (best-effort) an episode list; actual stream decryption is out of scope
// for the data layer. All network calls are wrapped in try/catch.

const ALLMANGA_API = "https://api.allmanga.to/api";

const SLUG_QUERY = `query($id:Int){Media(id:$id){idMal slug}}`;

async function allmangaGraphQL(query: string, variables: any): Promise<any> {
  const res = await fetch(ALLMANGA_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AllManga ${res.status}`);
  return res.json();
}

export const getAllMangaUrl = async (
  anilistId: any,
  title?: string,
): Promise<string> => {
  try {
    if (anilistId) {
      const json = await allmangaGraphQL(SLUG_QUERY, {
        id: Number(anilistId),
      });
      const slug = json?.data?.Media?.slug;
      if (slug) return `https://allmanga.to/anime/${slug}`;
    }
  } catch (e) {
    console.warn('getAllMangaUrl slug resolve failed', e);
  }
  return `https://allmanga.to/search?query=${encodeURIComponent(title || "")}`;
};

export const getAllMangaEpisodes = async (
  anilistId: any,
): Promise<Array<{ episode: any; url: string }>> => {
  try {
    if (!anilistId) return [];
    const json = await allmangaGraphQL(SLUG_QUERY, {
      id: Number(anilistId),
    });
    const slug = json?.data?.Media?.slug;
    if (!slug) return [];

    // AllManga exposes an episode list on the anime page; we build per-episode
    // deep links best-effort. Without a documented public episode GQL we fall
    // back to constructing watch URLs from the slug + episode number.
    // Returning an empty array here is acceptable; the player source handles
    // resolving the actual stream. We attempt a best-effort fetch of the
    // anime page to discover episode count.
    const pageRes = await fetch(`https://allmanga.to/anime/${slug}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!pageRes.ok) return [];

    const html = await pageRes.text();
    const epMatch = html.match(/episodes?\D+(\d+)/i);
    const count = epMatch ? parseInt(epMatch[1], 10) : 0;
    if (!count || isNaN(count)) return [];

    const out: Array<{ episode: number; url: string }> = [];
    for (let i = 1; i <= count; i++) {
      out.push({ episode: i, url: `https://allmanga.to/anime/${slug}/${i}` });
    }
    return out;
  } catch (e) {
    console.warn('getAllMangaEpisodes failed', e);
    return [];
  }
};
