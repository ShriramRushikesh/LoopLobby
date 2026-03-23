import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Room from './pages/Room';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
       staleTime: 1000 * 60 * 5, // 5 minutes
       gcTime: 1000 * 60 * 30, // 30 minutes
       retry: 1,
       refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const location = useLocation();
  const isRoom = location.pathname.startsWith('/room/');

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-950 text-white selection:bg-pink-500/30 overflow-x-hidden">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:id" element={<Room />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </main>
      
      {/* Show footer only on Home and Legal pages, not in the Room */}
      {!isRoom && <Footer />}
      <CookieBanner />
      <GlobalAudioPlayer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
