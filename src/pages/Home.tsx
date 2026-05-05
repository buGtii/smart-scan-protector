import { Link } from "react-router-dom";
import { Link2, MessageSquare, FileSearch, Globe, Activity, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cards = [
  { to: "/url", icon: Link2, title: "URL Scanner", desc: "Detect phishing links", grad: "from-cyan-500/20 to-blue-500/20" },
  { to: "/message", icon: MessageSquare, title: "Message AI", desc: "Gemini analysis of SMS/email", grad: "from-purple-500/20 to-pink-500/20" },
  { to: "/file", icon: FileSearch, title: "File Hash", desc: "VirusTotal lookup", grad: "from-emerald-500/20 to-teal-500/20" },
  { to: "/ip", icon: Globe, title: "IP Lookup", desc: "Reputation check", grad: "from-amber-500/20 to-orange-500/20" },
];

export default function Home() {
  const [stats, setStats] = useState({ total: 0, malicious: 0 });
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("scans").select("verdict").eq("user_id", user.id);
      if (data) setStats({
        total: data.length,
        malicious: data.filter(d => d.verdict === "malicious" || d.verdict === "suspicious").length,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gradient-cyber opacity-20 blur-3xl" />
        <p className="text-xs font-mono text-primary mb-1">SECURITY STATUS</p>
        <h2 className="text-3xl font-bold mb-1">All systems <span className="text-gradient-cyber">monitoring</span></h2>
        <p className="text-sm text-muted-foreground">Real-time AI + blockchain-verified scanning.</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-background/40 rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3 w-3" /> Total scans</div>
            <div className="text-2xl font-mono font-bold mt-1">{stats.total}</div>
          </div>
          <div className="bg-background/40 rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Cpu className="h-3 w-3" /> Threats blocked</div>
            <div className="text-2xl font-mono font-bold mt-1 text-warning">{stats.malicious}</div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.to}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}>
              <Link to={c.to}
                className={`block glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/50 transition-all bg-gradient-to-br ${c.grad}`}>
                <Icon className="h-6 w-6 text-primary mb-2" />
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
              </Link>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
