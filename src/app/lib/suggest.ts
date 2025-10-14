// src/lib/suggest.ts
/**
 * Fetch keyword ideas from Google Autocomplete (unauthenticated, free).
 * NOTE: This is an unofficial endpoint intended for MVP prototyping only.
 */
export async function getSuggestions(seed: string): Promise<string[]> {
    const q = encodeURIComponent(seed);
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${q}&hl=en`;
  
    const res = await fetch(url, {
      // A UA helps avoid some edge cases with this endpoint
      headers: { "User-Agent": "seo-mini/0.1 (+mvp)" },
      // Avoid caching during dev
      cache: "no-store",
    });
  
    if (!res.ok) return [];
  
    // Response shape (Firefox client): [ "seed", ["idea1","idea2",...], ... ]
    const json = (await res.json()) as [string, string[]];
    const ideas = Array.isArray(json?.[1]) ? json[1] : [];
  
    // Deduplicate & limit to top 10
    const uniq = Array.from(new Set(ideas)).slice(0, 10);
  
    return uniq;
  }
  