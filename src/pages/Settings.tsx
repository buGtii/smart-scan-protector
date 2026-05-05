import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCfg, setCfg, connectWallet, readMockLedger } from "@/lib/blockchain";
import { Settings as SettingsIcon, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [cfg, setCfgState] = useState(getCfg());
  const [addr, setAddr] = useState<string | null>(null);

  function save(next = cfg) {
    setCfg(next); setCfgState(next); toast.success("Saved");
  }
  async function connect() {
    try { const { address } = await connectWallet(); setAddr(address); toast.success("Wallet connected"); }
    catch (e: any) { toast.error(e.message); }
  }

  const ledger = readMockLedger();

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 mb-2"><SettingsIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Settings</h2></div>
      </header>

      <section className="glass rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Real blockchain mode</Label>
            <p className="text-xs text-muted-foreground">Log scans to Sepolia via MetaMask. Off = local mock ledger.</p>
          </div>
          <Switch checked={cfg.realMode} onCheckedChange={v => save({ ...cfg, realMode: v })} />
        </div>
        <div>
          <Label>Contract address</Label>
          <Input placeholder="0x..." className="font-mono text-xs"
            value={cfg.contractAddress}
            onChange={e => setCfgState({ ...cfg, contractAddress: e.target.value })}
            onBlur={() => save()} />
          <p className="text-[10px] text-muted-foreground mt-1">Deploy <code>contracts/CyberSmartLogger.sol</code> via Remix on Sepolia, paste address here.</p>
        </div>
        <Button onClick={connect} variant="outline" className="w-full">
          <Wallet className="h-4 w-4 mr-2" /> {addr ? `Connected: ${addr.slice(0,6)}…${addr.slice(-4)}` : "Connect MetaMask"}
        </Button>
      </section>

      <section className="glass rounded-2xl p-4">
        <h3 className="font-semibold mb-2">Mock ledger ({ledger.length})</h3>
        <div className="space-y-1 max-h-64 overflow-auto">
          {ledger.slice(0, 20).map(e => (
            <div key={e.id} className="text-xs font-mono flex justify-between gap-2 p-2 rounded bg-secondary/40">
              <span className="text-primary">{e.scanType}</span>
              <span className="truncate flex-1 text-muted-foreground">{e.targetHash.slice(0, 16)}…</span>
              <span className="text-warning">{e.verdict}</span>
            </div>
          ))}
          {ledger.length === 0 && <p className="text-xs text-muted-foreground">Empty</p>}
        </div>
      </section>
    </div>
  );
}
