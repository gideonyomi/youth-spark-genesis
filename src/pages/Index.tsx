import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import GeneralOverseerSection from "@/components/GeneralOverseerSection";
import ProgramsSection from "@/components/ProgramsSection";
import MinistriesSection from "@/components/MinistriesSection";
import EventsSection from "@/components/EventsSection";
import HistorySection from "@/components/HistorySection";
import LeadershipSection from "@/components/LeadershipSection";
import LiveStreamSection from "@/components/LiveStreamSection";
import TestimoniesSection from "@/components/TestimoniesSection";
import PrayerRequestSection from "@/components/PrayerRequestSection";
import JoinSection from "@/components/JoinSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <GeneralOverseerSection />
      <ProgramsSection />
      <MinistriesSection />
      <EventsSection />
      <HistorySection />
      <LeadershipSection />
      <LiveStreamSection />
      <TestimoniesSection />
      <PrayerRequestSection />
      <JoinSection />
      <Footer />
    </div>
  );
};

export default Index;
