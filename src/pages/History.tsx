import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History as HistoryIcon, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function History() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("scans").select("*").order("created_at", { ascending: false }).limit(100);
      setRows(data || []);
    })();
  }, []);

  const colors: Record<string, string> = {
    safe: "text-success", suspicious: "text-warning", malicious: "text-destructive", unknown: "text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2 mb-2"><HistoryIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Scan History</h2></div>
        <p className="text-sm text-muted-foreground">Blockchain-anchored ledger of your scans.</p>
      </header>

      {rows.length === 0 && (
        <div className="glass rounded-xl p-8 text-center text-sm text-muted-foreground">No scans yet.</div>
      )}

      <div className="space-y-2">
        {rows.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass rounded-xl p-3 flex items-center gap-3">
            <div className="text-xs font-mono uppercase px-2 py-1 rounded bg-secondary/60 text-primary">{r.scan_type}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{r.target}</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {new Date(r.created_at).toLocaleString()}
                {r.blockchain_tx && (
                  <a href={`https://sepolia.etherscan.io/tx/${r.blockchain_tx}`} target="_blank" rel="noreferrer"
                    className="ml-2 text-accent hover:underline inline-flex items-center gap-0.5">
                    on-chain <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>
            <div className={`text-xs font-bold ${colors[r.verdict] || ""}`}>{r.verdict}</div>
            <div className="text-xs font-mono text-muted-foreground">{r.risk_score}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
