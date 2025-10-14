// src/lib/dataforseo.ts
// Minimal client for DataForSEO "keywords for keywords" (Google Ads)
// Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live/

type DFTask = {
    keywords: string[];              // seed(s)
    location_name?: string;          // e.g., "United States"
    language_name?: string;          // e.g., "English"
  };
  
  type DFItem = {
    keyword: string;
    search_volume?: number;
    cpc?: number;
    competition?: number;
  };
  
  function getAuthHeader() {
    const login = process.env.DATAFORSEO_LOGIN || "";
    const password = process.env.DATAFORSEO_PASSWORD || "";
    const token = Buffer.from(`${login}:${password}`).toString("base64");
    return `Basic ${token}`;
  }
  
  async function dfFetch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`https://api.dataforseo.com/v3${path}`, {
      method: "POST",
      headers: {
        "Authorization": getAuthHeader(),
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify([body]),   // DataForSEO expects an array of tasks
      // server-only: no-store to avoid caching creds
      cache: "no-store",
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DataForSEO error ${res.status}: ${text}`);
    }
    return (await res.json()) as T;
  }
  
  /**
   * Fetch keyword ideas + volumes for a given seed.
   * Returns top 10 ideas sorted by search volume (desc).
   */
  export async function getDFKeywordIdeas(seed: string, location = "United States", language = "English") {
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      throw new Error("Missing DataForSEO credentials. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env.local");
    }
  
    type DFResponse = {
      tasks: Array<{
        result?: Array<{
          items?: DFItem[];
        }>;
      }>;
    };
  
    const task: DFTask = {
      keywords: [seed],
      location_name: location,
      language_name: language,
    };
  
    const json = await dfFetch<DFResponse>(
      "/keywords_data/google_ads/keywords_for_keywords/live",
      task
    );
  
    const items: DFItem[] =
      json?.tasks?.[0]?.result?.[0]?.items?.filter(Boolean) ?? [];
  
    // Top 10 by search volume
    const top = items
      .filter((i) => typeof i.search_volume === "number")
      .sort((a, b) => (b.search_volume ?? 0) - (a.search_volume ?? 0))
      .slice(0, 10);
  
    const recommendedKeywords = top.map((i) => i.keyword);
  
    // Basic aggregate volume (avg of top items)
    const avgVolume =
      top.length > 0
        ? Math.round(
            top.reduce((s, i) => s + (i.search_volume ?? 0), 0) / top.length
          )
        : 0;
  
    // Derive a 0–100 trend-like score from volume (very rough)
    const trendScore = Math.max(0, Math.min(100, Math.round(avgVolume / 100)));
  
    return {
      recommendedKeywords,
      estimatedMonthlySearches: avgVolume,
      trendScore,
      source: "dataforseo (google_ads/keywords_for_keywords)",
    };
  }
  