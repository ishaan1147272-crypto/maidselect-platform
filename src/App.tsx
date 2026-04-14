import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { Navbar } from "@/components/Navbar";
import Index from "./pages/Index";
import MaidProfile from "./pages/MaidProfile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AddMaid from "./pages/AddMaid";
import Cart from "./pages/Cart";
import BookingSuccess from "./pages/BookingSuccess";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/maid/:id" element={<MaidProfile />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/admin/add-maid" element={<ProtectedRoute><AddMaid /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
