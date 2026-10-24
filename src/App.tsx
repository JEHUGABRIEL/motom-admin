import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Espace d'administration MOTOM — application séparée du site public.
// Routes : / (connexion + tableau de bord), /invite, /reset.
const Admin = lazy(() => import("./pages/Admin"));
const AdminInvite = lazy(() => import("./pages/AdminInvite"));
const AdminReset = lazy(() => import("./pages/AdminReset"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <Loader2 size={22} className="animate-spin text-gold" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/invite" element={<AdminInvite />} />
          <Route path="/reset" element={<AdminReset />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </QueryClientProvider>
  );
}
