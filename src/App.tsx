import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Register from "./pages/Register";
import Leadership from "./pages/Leadership";
import Login from "./pages/admin/Login";
import AdminLayout from "./components/admin/AdminLayout";
import {
  Dashboard, PrayerInbox, TestimonyInbox, RegistrationInbox, ContactInbox, NewsletterInbox,
  SiteSettingsEdit, HeroEdit, AboutEdit, OverseerEdit,
  ProgramsEdit, MinistriesEdit, EventsEdit, HistoryEdit, LeadershipEdit, LivestreamEdit, FeaturedTestimoniesEdit,
} from "./pages/admin/pages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register/:event" element={<Register />} />
            <Route path="/leadership" element={<Leadership />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="inbox/prayer" element={<PrayerInbox />} />
              <Route path="inbox/testimonies" element={<TestimonyInbox />} />
              <Route path="inbox/registrations" element={<RegistrationInbox />} />
              <Route path="inbox/contact" element={<ContactInbox />} />
              <Route path="inbox/newsletter" element={<NewsletterInbox />} />
              <Route path="content/settings" element={<SiteSettingsEdit />} />
              <Route path="content/hero" element={<HeroEdit />} />
              <Route path="content/about" element={<AboutEdit />} />
              <Route path="content/overseer" element={<OverseerEdit />} />
              <Route path="content/programs" element={<ProgramsEdit />} />
              <Route path="content/ministries" element={<MinistriesEdit />} />
              <Route path="content/events" element={<EventsEdit />} />
              <Route path="content/history" element={<HistoryEdit />} />
              <Route path="content/leadership" element={<LeadershipEdit />} />
              <Route path="content/livestream" element={<LivestreamEdit />} />
              <Route path="content/featured-testimonies" element={<FeaturedTestimoniesEdit />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
