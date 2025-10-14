// /src/app/api/analyze/route.ts
import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { fetchSeoData } from "@/lib/provider";


export async function GET() {
  return Response.json({ ok: true, route: "/api/analyze" });
}

export async function POST(req: NextRequest) {
  // --- rate limit (10 req / minute per IP) ---
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local";

  const rl = rateLimit(`analyze:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a minute." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  // -------------------------------------------

  try {
    const body = await req.json();
    const input = (body?.url ?? "").toString().trim();

    // Validate URL
    let target: URL;
    try {
      target = new URL(input);
      if (!/^https?:/.test(target.protocol)) throw new Error("bad protocol");
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL. Use https://example.com" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Seed from hostname (before first dot)
    const hostname = target.hostname.replace(/^www\./, "");
    const seed = hostname.split(".")[0] || "site";

    // Free MVP data: Google Trends
    const result = await fetchSeoData(seed);

    return Response.json({
      status: "ok",
      domain: hostname,
      searchVolumeEstimate: result.estimatedMonthlySearches,
      trendScore: result.trendScore,
      recommendedKeywords: result.recommendedKeywords,
      seed,
      source: result.source,
      rateLimit: { remaining: rl.remaining, resetInMs: rl.resetInMs },
    });
    