import { NavLink, useLocation } from "react-router-dom";
import { Shield, Link2, MessageSquare, FileSearch, Globe, History, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getChainStatus, type ChainStatus } from "@/lib/blockchain";

const tabs = [
  { to: "/", icon: Shield, label: "Home" },
  { to: "/url", icon: Link2, label: "URL" },
  { to: "/message", icon: MessageSquare, label: "Msg" },
  { to: "/file", icon: FileSearch, label: "File" },
  { to: "/ip", icon: Globe, label: "IP" },
  { to: "/history", icon: History, label: "Log" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const [chain, setChain] = useState<ChainStatus | null>(null);
  useEffect(() => {
    getChainStatus().then(setChain);
    const t = setInterval(() => getChainStatus().then(setChain), 15000);
    return () => clearInterval(t);
  }, [loc.pathname]);
  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <header
        className="glass sticky top-0 z-30 px-4 flex items-center justify-between"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)",
          paddingBottom: "0.75rem",
          paddingLeft: "calc(env(safe-area-inset-left, 0px) + 1rem)",
          paddingRight: "calc(env(safe-area-inset-right, 0px) + 1rem)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-cyber grid place-items-center glow">
            <Shield className="h-5 w-5 text-background" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-gradient-cyber">CyberSmart</h1>
            <p className="text-[10px] text-muted-foreground font-mono">AI · BLOCKCHAIN · SECURITY</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chain && (
            <NavLink
              to="/settings"
              title={chain.reason}
              className={`hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-full ${
                chain.ready
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${chain.ready ? "bg-success" : "bg-warning"} animate-pulse`} />
              {chain.mode === "real" ? "ON-CHAIN" : "MOCK"}
            </NavLink>
          )}
          <NavLink to="/settings" className="p-2 rounded-lg hover:bg-secondary/60">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </NavLink>
          {user && (
            <button onClick={() => signOut()} className="p-2 rounded-lg hover:bg-secondary/60">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <main
        className="flex-1 p-4 max-w-2xl w-full mx-auto"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)" }}
      >
        <motion.div
          key={loc.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >{children}</motion.div>
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 glass border-t border-primary/20 z-30"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-6">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
