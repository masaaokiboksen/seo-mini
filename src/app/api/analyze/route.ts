import { NextRequest, NextResponse } from "next/server";
import { getKeywordIdeas } from "@/lib/trends";
import { getSuggestions } from "@/lib/suggest";
import { rateLimit } from "@/lib/rate-limit";
import { fetchSeoData } from "@/lib/provider"; // optional depending on your setup

export async function POST(req: NextRequest) {
  try {
    await rateLimit(req);

    const { url, provider } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const domain = new URL(url).hostname;
    let result;

    if (provider === "trends") {
      result = await getKeywordIdeas(domain);
    } else if (provider === "suggest") {
      result = await getSuggestions(domain);
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    return NextResponse.json({
      status: "ok",
      domain,
      searchVolumeEstimate: result.estimatedMonthlySearches ?? 0,
      trendScore: result.trendScore ?? 0,
      recommendedKeywords: result.recommendedKeywords ?? [],
      source: provider,
    });
  } catch (err: any) {
    console.error("API Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
