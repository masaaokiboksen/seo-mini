// src/lib/provider.ts
import { getSuggestions } from "@/lib/suggest";
import { getDFKeywordIdeas } from "@/lib/dataforseo";

export type ProviderResult = {
  trendScore: number;
  estimatedMonthlySearches: number;
  recommendedKeywords: string[];
  source: string;
};

const mode = (provider || process.env.NEXT_PUBLIC_PROVIDER || "trends").toLowerCase();

/** Centralized provider switch for your SEO data */
export async function fetchSeoData(seed: string, provider?: string): Promise<ProviderResult> {

  switch (PROVIDER) {
    case "dataforseo": {
      const df = await getDFKeywordIdeas(seed);
      return df;
    }

    case "suggest": {
      const ideas = await getSuggestions(seed);
      const trendScore = Math.min(100, Math.max(5, Math.round(ideas.length * 8)));
      const estimatedMonthlySearches = trendScore * 80;
      return {
        trendScore,
        estimatedMonthlySearches,
        recommendedKeywords: ideas,
        source: "google-autocomplete (free, unofficial)",
      };
    }

    case "trends":
    default: {
      const t = await getKeywordIdeas(seed);
      return {
        trendScore: t.trendScore,
        estimatedMonthlySearches: t.estimatedMonthlySearches,
        recommendedKeywords: t.recommendedKeywords,
        source: "google-trends-api (free MVP)",
      };
    }
  }
}
