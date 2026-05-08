import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import JobsPage from "./pages/JobsPage";
import JobDetailPage from "./pages/JobDetailPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import TrustHubPage from "./pages/TrustHubPage";
import PathChoice from "./pages/PathChoice";
import ProfileStep from "./pages/onboarding/ProfileStep";
import RegistrationPayStep from "./pages/onboarding/RegistrationPayStep";
import JobsStep from "./pages/onboarding/JobsStep";
import ServicesStep from "./pages/onboarding/ServicesStep";
import DocumentsStep from "./pages/onboarding/DocumentsStep";
import BatchStep from "./pages/onboarding/BatchStep";
import SponsorshipStep from "./pages/onboarding/SponsorshipStep";
import ReadyStep from "./pages/onboarding/ReadyStep";
import AIChatbot from "./components/AIChatbot";
import WhatsAppButton from "./components/WhatsAppButton";

const queryClient = new QueryClient();

const App = () =>(
<ErrorBoundary>
<ThemeProvider>
<QueryClientProvider client={queryClient}>
<TooltipProvider>
<Toaster />
<Sonner />
<BrowserRouter>
<AuthProvider>
<CurrencyProvider>
<Routes>
 {/* Public */}
<Route path="/" element={<Home />} />
<Route path="/home" element={<Index />} />
<Route path="/auth" element={<AuthPage />} />
<Route path="/jobs" element={<JobsPage />} />
<Route path="/jobs/:id" element={<JobDetailPage />} />
<Route path="/services" element={<ServicesPage />} />
<Route path="/services/:id" element={<ServiceDetailPage />} />
<Route path="/how-it-works" element={<HowItWorksPage />} />
<Route path="/trust" element={<TrustHubPage />} />

 {/* Authenticated - onboarding flow */}
<Route path="/welcome" element={<ProtectedRoute><PathChoice /></ProtectedRoute>} />
<Route path="/onboarding/profile" element={<ProtectedRoute><ProfileStep /></ProtectedRoute>} />
<Route path="/onboarding/registration-pay" element={<ProtectedRoute><RegistrationPayStep /></ProtectedRoute>} />
<Route path="/onboarding/jobs" element={<ProtectedRoute><JobsStep /></ProtectedRoute>} />
<Route path="/onboarding/services" element={<ProtectedRoute><ServicesStep /></ProtectedRoute>} />
<Route path="/onboarding/documents" element={<ProtectedRoute><DocumentsStep /></ProtectedRoute>} />
<Route path="/onboarding/batch" element={<ProtectedRoute><BatchStep /></ProtectedRoute>} />
<Route path="/onboarding/sponsorship" element={<ProtectedRoute><SponsorshipStep /></ProtectedRoute>} />
<Route path="/onboarding/ready" element={<ProtectedRoute><ReadyStep /></ProtectedRoute>} />

 {/* Dashboard (full hub) */}
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

 {/* Admin */}
<Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

<Route path="*" element={<NotFound />} />
</Routes>
<AIChatbot />
<WhatsAppButton />
</CurrencyProvider>
</AuthProvider>
</BrowserRouter>
</TooltipProvider>
</QueryClientProvider>
</ThemeProvider>
</ErrorBoundary>
);

export default App;
