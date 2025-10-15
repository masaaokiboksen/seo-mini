// src/lib/trends.ts
import googleTrends from "google-trends-api";

export async function getKeywordIdeas(seed: string) {
  const [relatedRaw, interestRaw] = await Promise.all([
    googleTrends.relatedQueries({
      keyword: seed,
      geo: "US",
      timeframe: "today 12-m",
    }),
    googleTrends.interestOverTime({
      keyword: seed,
      geo: "US",
      timeframe: "today 12-m",
    }),
  ]);

  const related = JSON.parse(relatedRaw);
  const interest = JSON.parse(interestRaw);

  const ideas: string[] =
    related?.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10).map((k: any) => k.query) ?? [];

  const points = interest?.default?.timelineData ?? [];
  const trendScore =
    points.length > 0
      ? Math.round(points.reduce((s: number, p: any) => s + Number(p.value?.[0] ?? 0), 0) / points.length)
      : 0;

  const estimatedMonthlySearches = trendScore * 100; // simple MVP scaling

  return { recommendedKeywords: ideas, trendScore, estimatedMonthlySearches };
}
