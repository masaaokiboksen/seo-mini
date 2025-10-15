"use client";

import { useState } from "react";
import { downloadCSV, Row } from "@/lib/csv";

type AnalyzeResponse = {
  status: "ok";
  domain: string;
  searchVolumeEstimate: number;
  trendScore: number;
  recommendedKeywords: string[];
  seed?: string;
  source?: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [provider, setProvider] = useState("trends");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);

    // validate URL
    try {
      const u = new URL(url);
      if (!u.protocol.startsWith("http")) throw new Error();
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, provider }),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => ({}));
        throw new Error(msg?.error || "Request failed");
      }

      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onDownload = () => {
    if (!data) return;
    const rows: Row[] = data.recommendedKeywords.map((kw) => ({
      keyword: kw,
      trendScore: data.trendScore,
      estimatedMonthlySearches: data.searchVolumeEstimate,
      domain: data.domain,
      source: data.source ?? "",
    }));
    downloadCSV(`${data.domain}-keywords`, rows);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-semibold mb-6">SEO Mini — URL Analyzer</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="https://example.com"
            className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:ring-2 focus:ring-black"
          />

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600">Provider:</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white p-2 text-sm"
            >
              <option value="trends">Google Trends (Free)</option>
              <option value="suggest">Google Autocomplete (Free)</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-black bg-black text-white p-3 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </form>

        {data && (
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Results for {data.domain}
                </h2>
                {data.seed && (
                  <p className="text-xs text-gray-500">Seed: {data.seed}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium">
                  Trend Score:{" "}
                  <span className="ml-1 font-semibold">{data.trendScore}</span>
                </span>
                {data.source && (
                  <span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium">
                    {data.source}
                  </span>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 mt-4">
              Estimated Monthly Searches:{" "}
              <span className="font-medium">{data.searchVolumeEstimate}</span>
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-3">Keyword</th>
                    <th className="py-2 pr-3">Trend Score</th>
                    <th className="py-2 pr-3">Est. Monthly Searches</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recommendedKeywords.map((kw) => (
                    <tr key={kw} className="border-b last:border-0">
                      <td className="py-2 pr-3">{kw}</td>
                      <td className="py-2 pr-3">{data.trendScore}</td>
                      <td className="py-2 pr-3">{data.searchVolumeEstimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <button
                onClick={onDownload}
                className="rounded-xl border border-black bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Download CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
