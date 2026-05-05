import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const KEY = Deno.env.get("LOVABLE_API_KEY");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string" || message.length > 5000) {
      return new Response(JSON.stringify({ error: "message required (<=5000 chars)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Local heuristics: extract URLs
    const urls = message.match(/https?:\/\/[^\s)]+/g) || [];
    const localFlags: string[] = [];
    if (/urgent|verify|suspended|locked|click here|act now/i.test(message)) localFlags.push("Urgency language");
    if (/password|otp|cvv|ssn|social security/i.test(message)) localFlags.push("Requests sensitive info");
    if (/won|prize|lottery|congratulations/i.test(message)) localFlags.push("Prize/lottery bait");

    const sys = `You are CyberSmart's AI security analyst. Analyze the message for phishing, scam, smishing, or social engineering. Respond ONLY with valid JSON matching this schema:
{
  "verdict": "safe" | "suspicious" | "malicious",
  "risk_score": number (0-100),
  "category": "phishing" | "scam" | "smishing" | "spam" | "legitimate" | "other",
  "red_flags": string[],
  "explanation": string (2-3 sentences),
  "recommendation": string (one actionable sentence)
}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Message:\n${message}\n\nExtracted URLs: ${urls.join(", ") || "none"}\nLocal heuristic flags: ${localFlags.join(", ") || "none"}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const j = await r.json();
    const content = j.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { verdict: "suspicious", risk_score: 50, explanation: content }; }
    parsed.urls_found = urls;
    parsed.local_flags = localFlags;
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
