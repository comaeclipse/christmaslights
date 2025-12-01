import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { Review, LocationData } from './types';
import { api } from './services/apiClient';

// Lazy load components
const LightMap = lazy(() => import('./components/LightMap'));
const Privacy = lazy(() => import('./components/Privacy'));
const Legal = lazy(() => import('./components/Legal'));

// Home Component encapsulates the main map view logic
const Home: React.FC<{
  locations: LocationData[];
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
}> = ({ locations, reviews, setReviews }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Cookie helper to prevent duplicate reviews
  const hasReviewed = (locationId: string): boolean => {
    return document.cookie.split(';').some((item) => item.trim().startsWith(`reviewed_${locationId}=`));
  };

  const markAsReviewed = (locationId: string) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    document.cookie = `reviewed_${locationId}=true; expires=${date.toUTCString()}; path=/`;
  };

  const handleAddReview = async (locationId: string, rating: number, text: string) => {
    if (hasReviewed(locationId)) {
      alert("You have already reviewed this location!");
      return;
    }

    try {
      const newReview = await api.createReview({
        locationId,
        rating,
        text,
        author: 'A Festive Visitor',
      });

      setReviews(prev => [newReview, ...prev]);
      markAsReviewed(locationId);
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLocationSelect = (id: string | null) => {
    setSelectedLocationId(id);
    if (id) {
      setIsSidebarOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden flex bg-gray-50">
      <Sidebar 
        locations={locations} 
        reviews={reviews}
        selectedLocationId={selectedLocationId}
        onLocationSelect={handleLocationSelect}
        onAddReview={handleAddReview}
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />

      <main className={`flex-1 relative h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-96' : 'ml-0'}`}>
        <button
          onClick={toggleSidebar}
          className={`absolute top-4 left-4 z-[400] bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-200 hover:bg-gray-50 transition-all ${isSidebarOpen ? 'hidden md:block' : 'block'}`}
          aria-label="Toggle Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-gray-50"><div className="text-slate-800">Loading map...</div></div>}>
          <LightMap
            locations={locations}
            reviews={reviews}
            selectedLocationId={selectedLocationId}
            onSelectLocation={handleLocationSelect}
          />
        </Suspense>

        <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-[399]"></div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getLocations(), api.getReviews()])
      .then(([locs, revs]) => {
        setLocations(locs);
        setReviews(revs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please refresh the page.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-slate-800 text-lg">Loading PensacolaLights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
          <div className="text-slate-800 text-lg">Loading...</div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Home locations={locations} reviews={reviews} setReviews={setReviews} />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/legal" element={<Legal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
