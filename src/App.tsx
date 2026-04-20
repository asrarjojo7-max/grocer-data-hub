import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Branches from "./pages/Branches";
import Receipts from "./pages/Receipts";
import NewReceipt from "./pages/NewReceipt";
import MyReceipts from "./pages/MyReceipts";
import MyWhatsApp from "./pages/MyWhatsApp";
import Reports from "./pages/Reports";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
