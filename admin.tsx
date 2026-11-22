import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import Manage from './components/Manage';
import { LocationData } from './types';
import { Analytics } from '@vercel/analytics/react';

const AdminApp: React.FC = () => {
  // Manage loads the full list (including archived houses) after login.
  const [locations, setLocations] = useState<LocationData[]>([]);
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
    <Analytics />
  </React.StrictMode>
);
