import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import UrlScan from "./pages/UrlScan";
import MessageScan from "./pages/MessageScan";
import FileScan from "./pages/FileScan";
import IpScan from "./pages/IpScan";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound.tsx";

const qc = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppShell>{children}</AppShell>;
}

const App = () => (
  <QueryClientProvider client={qc}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Protected><Home /></Protected>} />
          <Route path="/url" element={<Protected><UrlScan /></Protected>} />
          <Route path="/message" element={<Protected><MessageScan /></Protected>} />
          <Route path="/file" element={<Protected><FileScan /></Protected>} />
          <Route path="/ip" element={<Protected><IpScan /></Protected>} />
          <Route path="/history" element={<Protected><History /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
