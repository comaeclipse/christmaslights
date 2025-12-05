import React, { useState, useEffect } from 'react';
import { LocationData, Review, LocationSubmission } from '../types';
import { api } from '../services/apiClient';

interface AdminReview extends Review {
  ipAddress?: string;
  locationTitle?: string;
}

interface ManageProps {
  locations: LocationData[];
  setLocations: React.Dispatch<React.SetStateAction<LocationData[]>>;
}

const Manage: React.FC<ManageProps> = ({ locations, setLocations }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'locations' | 'reviews' | 'submissions'>('locations');
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submissions, setSubmissions] = useState<LocationSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<LocationData>>({
    title: '',
    description: '',
    address: '',
    schedule: '',
    notes: '',
    radioStation: '',
    lat: 30.4213,
    lng: -87.2169,
    featured: false
  });
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<string | null>(null);

  // Geocode address using Nominatim (OpenStreetMap)
  const handleGeocode = async () => {
    if (!formData.address) {
      setGeocodeStatus('Please enter an address first');
      return;
    }

    setIsGeocoding(true);
    setGeocodeStatus(null);

    try {
      // Use address as-is, only append Pensacola if not already included
      const address = formData.address.toLowerCase();
      const hasPensacola = address.includes('pensacola') || address.includes('32501') || 
                           address.includes('32502') || address.includes('32503') || 
                           address.includes('32504') || address.includes('32505') ||
                           address.includes('32506') || address.includes('32507') ||
                           address.includes('32508') || address.includes('32509') ||
                           address.includes('32511') || address.includes('32512') ||
                           address.includes('32513') || address.includes('32514') ||
                           address.includes('32516') || address.includes('32520') ||
                           address.includes('32521') || address.includes('32522') ||
                           address.includes('32523') || address.includes('32524') ||
                           address.includes('32526') || address.includes('32534') ||
                           address.includes('32559') || address.includes('32590') ||
                           address.includes('32591');
      
      const query = encodeURIComponent(hasPensacola ? formData.address : formData.address + ', Pensacola, FL');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'PensacolaLights/1.0' } }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setFormData(prev => ({
          ...prev,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        }));
        setGeocodeStatus(`✓ Found: ${display_name.split(',').slice(0, 3).join(',')}`);
      } else {
        // Try without street number as fallback
        const streetOnly = formData.address.replace(/^\d+\s*/, '');
        const fallbackQuery = encodeURIComponent(streetOnly + (hasPensacola ? '' : ', Pensacola, FL'));
        const fallbackResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`,
          { headers: { 'User-Agent': 'PensacolaLights/1.0' } }
        );
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData && fallbackData.length > 0) {
          const { lat, lon, display_name } = fallbackData[0];
          setFormData(prev => ({
            ...prev,
            lat: parseFloat(lat),
            lng: parseFloat(lon),
          }));
          setGeocodeStatus(`⚠️ Approximate: ${display_name.split(',').slice(0, 3).join(',')}`);
        } else {
          setGeocodeStatus('Address not found. Try removing the house number or use Google Maps to find coordinates.');
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
      setGeocodeStatus('Geocoding failed. Please enter coordinates manually.');
    } finally {
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Load reviews when switching to reviews tab
  useEffect(() => {
    if (activeTab === 'reviews' && authToken && reviews.length === 0) {
      loadReviews();
    }
  }, [activeTab, authToken]);

  // Load submissions when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && authToken && submissions.length === 0) {
      loadSubmissions();
    }
  }, [activeTab, authToken]);

  const loadReviews = async () => {
    if (!authToken) return;
    setLoadingReviews(true);
    try {
      const data = await api.adminGetReviews(authToken);
      setReviews(data);
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      if (error.status === 401) {
        handle401Error(error);
      }
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadSubmissions = async () => {
    if (!authToken) return;
    setLoadingSubmissions(true);
    try {
      const data = await api.adminGetSubmissions(authToken);
      setSubmissions(data);
    } catch (error: any) {
      console.error('Failed to load submissions:', error);
      if (error.status === 401) {
        handle401Error(error);
      }
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    if (!authToken) return;

    try {
      await api.adminDeleteReview(id, authToken);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      if (error.status === 401) {
        handle401Error(error);
      } else {
        alert('Failed to delete review');
      }
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    if (!authToken) return;

    try {
      await api.adminDeleteSubmission(id, authToken);
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
      console.error('Failed to delete submission:', error);
      if (error.status === 401) {
        handle401Error(error);
      } else {
        alert('Failed to delete submission');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { token } = await api.adminLogin(password);
      localStorage.setItem('admin_token', token);
      setAuthToken(token);
      setIsAuthenticated(true);
      setPassword('');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Incorrect password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAuthToken(null);
    setIsAuthenticated(false);
    setPassword('');
  };

  const handle401Error = (error: any) => {
    // If we get a 401 error, the token has likely expired
    console.error('Authentication error:', error);
    alert('Your session has expired. Please log in again.');
    handleLogout();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    try {
      if (isEditing) {
        const updated = await api.adminUpdateLocation(isEditing, formData, authToken);
        setLocations(prev =>
          prev.map(loc => (loc.id === isEditing ? updated : loc))
        );
        setIsEditing(null);
      } else {
        const newLocation = await api.adminCreateLocation(
          formData as Omit<LocationData, 'id'>,
          authToken
        );
        setLocations(prev => [...prev, newLocation]);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        address: '',
        schedule: '',
        notes: '',
        radioStation: '',
        lat: 30.4213,
        lng: -87.2169,
        featured: false,
      });
    } catch (error: any) {
      console.error('Failed to save:', error);
      // Check if it's an authentication error (401)
      if (error.status === 401) {
        handle401Error(error);
      } else {
        alert('Failed to save location. Please try again.');
      }
    }
  };

  const handleEdit = (loc: LocationData) => {
    setFormData(loc);
    setIsEditing(loc.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    if (!authToken) return;

    try {
      await api.adminDeleteLocation(id, authToken);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (error: any) {
      console.error('Failed to delete:', error);
      if (error.status === 401) {
        handle401Error(error);
      } else {
        alert('Failed to delete location');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-center">Admin Access</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-2 rounded mb-4"
              placeholder="Enter password"
              required
            />
            <button
              type="submit"
              className="w-full bg-slate-900 text-white p-2 rounded hover:bg-slate-800"
            >
              Login
            </button>
            <div className="mt-4 text-center">
                <a href="/" className="text-sm text-blue-500">Back to Home</a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
       <div className="max-w-6xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                className="bg-white border border-slate-300 px-4 py-2 rounded text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
              <a href="/" className="bg-white border border-slate-300 px-4 py-2 rounded text-slate-700 hover:bg-slate-50">
                Return to Map
              </a>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'locations' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              📍 Locations ({locations.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              ⭐ Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'submissions'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              📝 Submissions ({submissions.length})
            </button>
         </div>

         {activeTab === 'locations' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-1">
               <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 lg:sticky lg:top-8">
                  <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Location' : 'Add New Location'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input name="title" value={formData.title} onChange={handleInputChange} required className="w-full border p-2 rounded" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} required className="w-full border p-2 rounded text-sm" rows={2} />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <div className="flex gap-2">
                           <input name="address" value={formData.address} onChange={handleInputChange} required className="flex-1 border p-2 rounded" placeholder="123 Main St, Pensacola, FL" />
                           <button
                             type="button"
                             onClick={handleGeocode}
                             disabled={isGeocoding || !formData.address}
                             className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                           >
                             {isGeocoding ? '...' : '📍 Lookup'}
                           </button>
                        </div>
                        {geocodeStatus && (
                          <p className={`text-xs mt-1 ${geocodeStatus.startsWith('✓') ? 'text-green-600' : 'text-amber-600'}`}>
                            {geocodeStatus}
                          </p>
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Schedule (one per line)</label>
                        <textarea name="schedule" value={formData.schedule} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" rows={2} placeholder="Mon-Thu: 6pm-9pm&#10;Fri-Sat: 6pm-11pm" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-500">
                              <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/><path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/><circle cx="12" cy="9" r="2"/><path d="M16.2 4.7a6.14 6.14 0 0 1 .8 7.5"/><path d="M19.1 1.9a10.14 10.14 0 0 1 0 14.2"/><path d="M9.5 18h5"/><path d="m8 22 4-11 4 11"/>
                            </svg>
                            FM Radio Station
                          </span>
                        </label>
                        <input name="radioStation" value={formData.radioStation} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" placeholder="88.1 FM" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full border p-2 rounded text-sm" rows={1} placeholder="Free hot cocoa, donations accepted..." />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Coordinates (paste or enter manually)</label>
                        <input 
                          type="text" 
                          placeholder="30.39933, -87.26474"
                          className="w-full border p-2 rounded text-sm mb-2"
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            const match = value.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
                            if (match) {
                              setFormData(prev => ({
                                ...prev,
                                lat: parseFloat(match[1]),
                                lng: parseFloat(match[2]),
                              }));
                              setGeocodeStatus('✓ Coordinates set!');
                            }
                          }}
                        />
                        <div className="grid grid-cols-2 gap-2">
                           <input type="number" step="any" name="lat" value={formData.lat} onChange={handleInputChange} required className="w-full border p-2 rounded bg-gray-50 text-sm" placeholder="Lat" />
                           <input type="number" step="any" name="lng" value={formData.lng} onChange={handleInputChange} required className="w-full border p-2 rounded bg-gray-50 text-sm" placeholder="Lng" />
                        </div>
                     </div>
                     <div className="flex items-center">
                        <input type="checkbox" name="featured" id="featured" checked={formData.featured} onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="mr-2" />
                        <label htmlFor="featured" className="text-sm text-slate-700">Featured Location</label>
                     </div>
                     
                     <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">
                           {isEditing ? 'Update' : 'Add'}
                        </button>
                        {isEditing && (
                           <button 
                             type="button" 
                             onClick={() => { setIsEditing(null); setFormData({ title: '', description: '', address: '', schedule: '', notes: '', radioStation: '', lat: 30.4213, lng: -87.2169, featured: false }); }}
                             className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                           >
                             Cancel
                           </button>
                        )}
                     </div>
                  </form>
               </div>
            </div>

            {/* List Column */}
            <div className="lg:col-span-2">
               <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                        {locations.map((loc) => (
                           <tr key={loc.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                 <div className="text-sm font-medium text-gray-900">{loc.title}</div>
                                 <div className="text-sm text-gray-500 truncate max-w-xs">{loc.description}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                 {loc.address}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                 <button onClick={() => handleEdit(loc)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                 <button onClick={() => handleDelete(loc.id)} className="text-red-600 hover:text-red-900">Delete</button>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
         )}

         {activeTab === 'reviews' && (
         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">All Reviews</h2>
              <button 
                onClick={loadReviews} 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                🔄 Refresh
              </button>
            </div>
            {loadingReviews ? (
              <div className="p-8 text-center text-slate-500">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No reviews yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                      <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                      {reviews.map((review) => (
                         <tr key={review.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                               <div className="text-sm font-medium text-gray-900 max-w-[150px] truncate" title={review.locationTitle}>
                                 {review.locationTitle || 'Unknown'}
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="flex text-amber-400">
                                 {[1,2,3,4,5].map(star => (
                                   <span key={star} className={star <= review.rating ? '' : 'text-gray-300'}>★</span>
                                 ))}
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="text-sm text-gray-700 max-w-[200px] truncate" title={review.text}>
                                 {review.text}
                               </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                               {review.author}
                            </td>
                            <td className="px-4 py-3">
                               <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                 {review.ipAddress || 'N/A'}
                               </code>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                               {new Date(review.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                               <button 
                                 onClick={() => handleDeleteReview(review.id)} 
                                 className="text-red-600 hover:text-red-900"
                               >
                                 Delete
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            )}
         </div>
         )}

         {activeTab === 'submissions' && (
         <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Location Submissions</h2>
              <button
                onClick={loadSubmissions}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                🔄 Refresh
              </button>
            </div>
            {loadingSubmissions ? (
              <div className="p-8 text-center text-slate-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No submissions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                      <tr>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Additional Info</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                         <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                         <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                      {submissions.map((submission) => (
                         <tr key={submission.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                               <div className="text-sm font-medium text-gray-900 max-w-[200px]" title={submission.address}>
                                 {submission.address}
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               <div className="text-sm text-gray-700 max-w-[200px] truncate" title={submission.additionalInfo || ''}>
                                 {submission.additionalInfo || '-'}
                               </div>
                            </td>
                            <td className="px-4 py-3">
                               <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                 submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                 submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                                 'bg-red-100 text-red-800'
                               }`}>
                                 {submission.status}
                               </span>
                            </td>
                            <td className="px-4 py-3">
                               <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                 {submission.ipAddress || 'N/A'}
                               </code>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                               {new Date(submission.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                               <button
                                 onClick={() => handleDeleteSubmission(submission.id)}
                                 className="text-red-600 hover:text-red-900"
                               >
                                 Delete
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            )}
         </div>
         )}
       </div>
    </div>
  );
};

export default Manage;
