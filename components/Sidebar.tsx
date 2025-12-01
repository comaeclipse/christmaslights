import React, { useState, useEffect } from 'react';
import { LocationData, Review } from '../types';
import { Link } from 'react-router-dom';

interface SidebarProps {
  locations: LocationData[];
  reviews: Review[];
  selectedLocationId: string | null;
  onLocationSelect: (id: string | null) => void;
  onAddReview: (locationId: string, rating: number, text: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const StarRatingDisplay: React.FC<{ rating: number; size?: 'sm' | 'md' }> = ({ rating, size = 'sm' }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <svg 
        key={i} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={i <= rating ? "currentColor" : "none"} 
        stroke="currentColor"
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} ${i <= rating ? 'text-amber-400' : 'text-slate-300'}`}
      >
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
      </svg>
    );
  }
  return <div className="flex gap-0.5">{stars}</div>;
};

const Sidebar: React.FC<SidebarProps> = ({ locations, reviews, selectedLocationId, onLocationSelect, onAddReview, isOpen, toggleSidebar }) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  
  // Review Form State
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Copy Address State
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  // Reset states when selection changes
  useEffect(() => {
    setShowCopiedTooltip(false);
    setReviewRating(0);
    setReviewText('');
  }, [selectedLocationId]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLocationId && reviewRating > 0) {
      setIsSubmittingReview(true);
      onAddReview(selectedLocationId, reviewRating, reviewText);
      setReviewRating(0);
      setReviewText('');
      setIsSubmittingReview(false);
    }
  };
  
  const handleCopyAddress = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setShowCopiedTooltip(true);
      setTimeout(() => setShowCopiedTooltip(false), 2000);
    });
  };

  const getStats = (id: string) => {
    const locReviews = reviews.filter(r => r.locationId === id);
    if (locReviews.length === 0) return { avg: 0, count: 0 };
    const avg = locReviews.reduce((acc, curr) => acc + curr.rating, 0) / locReviews.length;
    return { avg, count: locReviews.length };
  };

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const locationReviews = selectedLocationId ? reviews.filter(r => r.locationId === selectedLocationId) : [];

  const mobileTranslate = isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-72px)]';
  const desktopTranslate = isOpen ? 'translate-x-0' : '-translate-x-full';

  return (
    <div 
      className={`fixed bg-white/95 backdrop-blur-md border-slate-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col shadow-2xl
        ${isMobile 
          ? `bottom-0 left-0 right-0 h-[72vh] rounded-t-3xl border-t ${mobileTranslate}` 
          : `top-0 left-0 h-full w-full md:w-96 border-r ${desktopTranslate}`}`}
    >
      {/* Header */}
      <div className={`flex items-center bg-white border-b border-slate-200 ${isMobile ? 'p-4 rounded-t-3xl relative' : 'p-6'}`}>
        {isMobile && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 h-1.5 w-14 rounded-full bg-slate-200"></div>
        )}
        <div className="cursor-pointer" onClick={() => onLocationSelect(null)}>
          <h1 className="font-display text-2xl md:text-3xl text-slate-800 tracking-tight">PensacolaLights</h1>
          <p className="text-[11px] md:text-xs text-slate-500 uppercase tracking-widest">Christmas Light Guide</p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button 
            onClick={toggleSidebar}
            className="md:hidden bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-full shadow hover:bg-slate-800 transition-colors"
          >
            {isOpen ? 'Close' : 'Open'}
          </button>
          <button 
            onClick={toggleSidebar}
            className="md:hidden text-slate-500 hover:text-slate-800"
            aria-label="Toggle list"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {/* DETAIL VIEW */}
        {selectedLocation ? (
          <div className="animate-fadeIn">
            <button 
              onClick={() => onLocationSelect(null)}
              className="mb-4 flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to List
            </button>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedLocation.title}</h2>
            
            <div className="flex items-center gap-2 mb-6">
              <StarRatingDisplay rating={getStats(selectedLocation.id).avg} size="md" />
              <span className="text-sm text-slate-500">({getStats(selectedLocation.id).count} reviews)</span>
            </div>
            
            <div className="space-y-3 mb-6">
              {/* Location Address Block */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Location</h3>
                
                <div 
                  className="group relative cursor-pointer hover:bg-slate-100 -mx-2 px-2 py-1 rounded transition-colors"
                  onClick={() => handleCopyAddress(selectedLocation.address || '')}
                  title="Click to copy address"
                >
                    <div className="flex items-start">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-2 mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                          <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors font-medium">{selectedLocation.address}</p>
                    </div>
                    {/* Copied Tooltip */}
                    <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow transition-all duration-300 ${showCopiedTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}>
                      Copied to clipboard!
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                </div>

                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedLocation.address || '')}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors ml-6"
                >
                  Get directions via Google Maps
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 ml-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>

              {(selectedLocation.schedule || selectedLocation.notes || selectedLocation.radioStation) && (
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Schedule & Notes</h3>
                  {selectedLocation.schedule && selectedLocation.schedule.split('\n').filter(Boolean).map((line, idx) => (
                    <p key={idx} className="text-sm text-slate-700 flex items-start">
                       {/* Lucide Clock icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 mt-0.5 text-blue-500 flex-shrink-0">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                       </svg>
                       {line}
                    </p>
                  ))}
                  {selectedLocation.radioStation && (
                    <p className="text-sm text-slate-700 flex items-start">
                       {/* Lucide Radio Tower icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 mt-0.5 text-purple-500 flex-shrink-0">
                          <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/>
                          <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/>
                          <circle cx="12" cy="9" r="2"/>
                          <path d="M16.2 4.7a6.14 6.14 0 0 1 .8 7.5"/>
                          <path d="M19.1 1.9a10.14 10.14 0 0 1 0 14.2"/>
                          <path d="M9.5 18h5"/>
                          <path d="m8 22 4-11 4 11"/>
                       </svg>
                       Tune to {selectedLocation.radioStation}
                    </p>
                  )}
                  {selectedLocation.notes && selectedLocation.notes.split('\n').filter(Boolean).map((line, idx) => (
                    <p key={`note-${idx}`} className="text-sm text-slate-700 flex items-start">
                       {/* Lucide Notebook Text icon */}
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2 mt-0.5 text-slate-500 flex-shrink-0">
                          <path d="M2 6h4"/>
                          <path d="M2 10h4"/>
                          <path d="M2 14h4"/>
                          <path d="M2 18h4"/>
                          <rect width="16" height="20" x="4" y="2" rx="2"/>
                          <path d="M9.5 8h5"/>
                          <path d="M9.5 12H16"/>
                          <path d="M9.5 16H14"/>
                       </svg>
                       {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="border-t border-slate-200 pt-6">
               <h3 className="text-sm font-bold text-slate-800 mb-4">Reviews</h3>
               
               {/* Add Review Form */}
               <form onSubmit={handleReviewSubmit} className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Leave a Review</p>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`focus:outline-none transition-transform hover:scale-110 ${reviewRating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                           <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                         </svg>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full bg-white border border-slate-200 rounded p-2 text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-amber-400 focus:outline-none mb-3 resize-none h-20"
                  />
                  <button 
                    type="submit" 
                    disabled={reviewRating === 0 || isSubmittingReview}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
                  </button>
               </form>

               {/* Reviews List */}
               <div className="space-y-4">
                 {locationReviews.length > 0 ? (
                   locationReviews.map((review) => (
                     <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                       <div className="flex justify-between items-start mb-1">
                         <span className="font-semibold text-sm text-slate-700">{review.author}</span>
                         <span className="text-xs text-slate-400">{new Date(review.date).toLocaleDateString()}</span>
                       </div>
                       <div className="mb-2">
                         <StarRatingDisplay rating={review.rating} />
                       </div>
                       {review.text && <p className="text-sm text-slate-600">{review.text}</p>}
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-slate-500 italic">No reviews yet. Be the first!</p>
                 )}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((loc) => {
              const stats = getStats(loc.id);
              return (
                <div 
                  key={loc.id}
                  onClick={() => onLocationSelect(loc.id)}
                  className="bg-white rounded-lg p-5 cursor-pointer hover:shadow-md transition-all border border-slate-200 group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 group-hover:text-amber-500 transition-colors text-lg">{loc.title}</h3>
                    {!!loc.featured && <span className="bg-amber-100 text-amber-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Featured</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRatingDisplay rating={Math.round(stats.avg)} />
                    <span className="text-xs text-slate-400">({stats.count})</span>
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {loc.address}
                  </div>
                  {loc.schedule && (
                    <div className="flex items-center text-xs text-blue-500">
                      {/* Lucide Clock icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {loc.schedule.split('\n')[0]}{loc.schedule.includes('\n') && '...'}
                    </div>
                  )}
                  {loc.radioStation && (
                    <div className="flex items-center text-xs text-purple-500 mt-1">
                      {/* Lucide Radio Tower icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                        <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/>
                        <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/>
                        <circle cx="12" cy="9" r="2"/>
                        <path d="M16.2 4.7a6.14 6.14 0 0 1 .8 7.5"/>
                        <path d="M19.1 1.9a10.14 10.14 0 0 1 0 14.2"/>
                        <path d="M9.5 18h5"/>
                        <path d="m8 22 4-11 4 11"/>
                      </svg>
                      {loc.radioStation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
         <p className="text-xs text-slate-400 mb-1">
           © {new Date().getFullYear()} PensacolaLights.
         </p>
         <div className="flex justify-center gap-4 text-[10px] text-slate-500">
           <Link to="/privacy" className="hover:text-slate-800 hover:underline">Privacy Policy</Link>
           <Link to="/legal" className="hover:text-slate-800 hover:underline">Legal Disclaimer</Link>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
