import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const VT = Deno.env.get("VIRUSTOTAL_API_KEY");

function b64url(s: string) {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function urlHeuristics(raw: string) {
  const reasons: string[] = [];
  let score = 0;
  try {
    const u = new URL(raw);
    const host = u.hostname;
    if (/^(\d+\.){3}\d+$/.test(host)) { score += 30; reasons.push("Uses raw IP address"); }
    if (host.length > 40) { score += 10; reasons.push("Very long hostname"); }
    if ((host.match(/-/g) || []).length >= 3) { score += 10; reasons.push("Many dashes in hostname"); }
    if (u.protocol !== "https:") { score += 15; reasons.push("Not using HTTPS"); }
    const suspiciousTlds = [".zip", ".mov", ".xyz", ".top", ".tk", ".click", ".country"];
    if (suspiciousTlds.some(t => host.endsWith(t))) { score += 20; reasons.push("Suspicious TLD"); }
    const brandKeywords = ["paypal", "apple", "microsoft", "google", "amazon", "bank", "secure", "verify", "login", "update", "wallet"];
    const bad = brandKeywords.filter(k => host.includes(k) && !host.endsWith(`${k}.com`));
    if (bad.length) { score += 25; reasons.push(`Brand impersonation: ${bad.join(", ")}`); }
    if (raw.length > 100) { score += 10; reasons.push("Very long URL"); }
    if (/@/.test(raw)) { score += 25; reasons.push("Contains @ symbol"); }
    if (u.pathname.split("/").length > 6) { score += 5; reasons.push("Deep path"); }
  } catch {
    reasons.push("Invalid URL format");
    score = 50;
  }
  return { score: Math.min(100, score), reasons };
}

async function virustotalUrl(url: string) {
  if (!VT) return null;
  try {
    const id = b64url(url);
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
      headers: { "x-apikey": VT },
    });
    if (res.status === 404) {
      // submit
      const form = new FormData();
      form.append("url", url);
      await fetch("https://www.virustotal.com/api/v3/urls", { method: "POST", headers: { "x-apikey": VT }, body: form });
      return { malicious: 0, suspicious: 0, harmless: 0, undetected: 0, pending: true };
    }
    if (!res.ok) return null;
    const data = await res.json();
    const stats = data?.data?.attributes?.last_analysis_stats || {};
    return { ...stats, pending: false };
  } catch { return null; }
}

async function geminiAnalysis(url: string, heuristics: any, vt: any) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return null;
  const prompt = `You are a cybersecurity expert. Briefly analyze this URL for phishing/malware risk in 2 sentences.
URL: ${url}
Heuristic findings: ${heuristics.reasons.join("; ") || "none"}
VirusTotal: ${vt ? JSON.stringify(vt) : "unavailable"}
Respond with plain text, no markdown.`;
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { url, _prefs } = body || {};
    const prefs = { useVirusTotal: true, useGemini: true, ..._prefs };
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "url required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const heuristics = urlHeuristics(url);
    const vt = prefs.useVirusTotal ? await virustotalUrl(url) : null;
    let score = heuristics.score;
    if (vt) {
      score += (vt.malicious || 0) * 15 + (vt.suspicious || 0) * 5;
    }
    score = Math.min(100, score);
    const verdict = score >= 70 ? "malicious" : score >= 40 ? "suspicious" : score >= 15 ? "unknown" : "safe";
    const ai = prefs.useGemini ? await geminiAnalysis(url, heuristics, vt) : null;
    return new Response(JSON.stringify({
      verdict, risk_score: score,
      heuristics, virustotal: vt, ai_analysis: ai,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
