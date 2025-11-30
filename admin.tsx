import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import Manage from './components/Manage';
import { api } from './services/apiClient';
import { LocationData } from './types';

const AdminApp: React.FC = () => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getLocations()
      .then((locs) => {
        setLocations(locs);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load locations:', err);
        setError('Failed to load locations. Please refresh the page.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-slate-800 text-lg">Loading admin...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return <Manage locations={locations} setLocations={setLocations} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
