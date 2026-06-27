import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, MemoryRouter, Route, Routes } from "react-router-dom";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Code-split every route for faster initial load, especially on mobile WebView.
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Branches = lazy(() => import("./pages/Branches"));
const Receipts = lazy(() => import("./pages/Receipts"));
const NewReceipt = lazy(() => import("./pages/NewReceipt"));
const MyReceipts = lazy(() => import("./pages/MyReceipts"));
const MyWhatsApp = lazy(() => import("./pages/MyWhatsApp"));
const Reports = lazy(() => import("./pages/Reports"));
const WhatsAppSettings = lazy(() => import("./pages/WhatsAppSettings"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const isBrowser = typeof window !== "undefined";
const isCapacitorNative =
  isBrowser && !!(window as any).Capacitor?.isNativePlatform?.();

function AppRouter({ children }: { children: React.ReactNode }) {
  if (isCapacitorNative) return <HashRouter>{children}</HashRouter>;
  if (isBrowser) return <BrowserRouter>{children}</BrowserRouter>;
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRouter>
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
            <Route path="/receipts/new" element={<ProtectedRoute><NewReceipt /></ProtectedRoute>} />
            <Route path="/my-receipts" element={<ProtectedRoute><MyReceipts /></ProtectedRoute>} />
            <Route path="/my-whatsapp" element={<ProtectedRoute><MyWhatsApp /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute adminOnly><Branches /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/whatsapp" element={<ProtectedRoute adminOnly><WhatsAppSettings /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
