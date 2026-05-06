import { useEffect, useState } from "react";
import { BookOpen, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { addXp } from "@/lib/gamify";

const TOPICS = [
  "MFA fatigue attack on a major SaaS provider",
  "SIM-swap heist targeting a crypto exchange",
  "Business email compromise wire fraud",
  "Supply-chain npm package poisoning",
  "Smishing campaign impersonating delivery couriers",
  "Pig-butchering romance + investment scam",
  "Quishing (QR phishing) parking meter scam",
  "Deepfake CEO voice fraud",
  "Browser-in-the-browser phishing kit",
  "Stealer malware in cracked software",
];

export default function ScamStory() {
  const [story, setStory] = useState("");
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");

  async function load(force = false) {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem("cs_scam_story_" + today);
    if (cached && !force) {
      const parsed = JSON.parse(cached);
      setStory(parsed.story); setTopic(parsed.topic);
      return;
    }
    setLoading(true); setStory("");
    const t = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setTopic(t);
    try {
      const r = await supabase.functions.invoke("copilot", {
        body: {
          mode: "beginner",
          messages: [{ role: "user", content: `Write a 200-word "Scam Story of the Day" about: ${t}. Structure: 1) The hook (how victims got tricked), 2) Red flags they missed, 3) Three specific defensive actions for a regular person. Use plain language and a sober, non-sensational tone.` }],
        },
      });
      // copilot streams; supabase-js returns the body. Try to read text.
      const text = typeof r.data === "string" ? r.data : "";
      let acc = "";
      if (text) {
        // parse SSE
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") break;
          try { acc += JSON.parse(payload).choices?.[0]?.delta?.content || ""; } catch {}
        }
      }
      const final = acc || "Could not load today's story. Tap refresh.";
      setStory(final);
      localStorage.setItem("cs_scam_story_" + today, JSON.stringify({ story: final, topic: t }));
      addXp(5, "Read scam story");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(false); }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-primary">DAILY BRIEFING</p>
          <h1 className="text-2xl font-bold">Scam story of the day</h1>
          <p className="text-sm text-muted-foreground">An AI-summarized real-world attack pattern, refreshed every 24 hours.</p>
        </div>
        <button onClick={() => load(true)} className="p-2 rounded-lg hover:bg-secondary/60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} /></button>
      </header>

      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-accent font-mono"><BookOpen className="h-3 w-3" /> {topic || "Loading topic..."}</div>
        {loading && <p className="text-sm text-muted-foreground">Generating today's briefing...</p>}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{story}</p>
      </div>
    </div>
  );
}
