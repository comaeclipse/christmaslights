import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData, Review } from '../types';
import { PENSACOLA_CENTER } from '../constants';

// Standard Leaflet Marker fixes are less relevant if we use custom DivIcons exclusively for our data,
// but good to keep for potential fallback or user location markers.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Traditional Map Pin Icon (Red)
const festiveIcon = L.divIcon({
  className: 'custom-pin-icon',
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3)); width: 100%; height: 100%;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  `,
  iconSize: [38, 38], // Slightly larger for better visibility
  iconAnchor: [19, 38], // Bottom tip of the pin
  popupAnchor: [0, -38] // Popup opens above the pin
});

interface LightMapProps {
  locations: LocationData[];
  reviews: Review[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string | null) => void;
}

const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
};

const LightMap: React.FC<LightMapProps> = ({ locations, reviews, selectedLocationId, onSelectLocation }) => {
  const selectedLoc = locations.find(l => l.id === selectedLocationId);
  const center = selectedLoc ? [selectedLoc.lat, selectedLoc.lng] as [number, number] : PENSACOLA_CENTER;

  const getAvgRating = (id: string) => {
    const locReviews = reviews.filter(r => r.locationId === id);
    if (locReviews.length === 0) return null;
    return (locReviews.reduce((acc, curr) => acc + curr.rating, 0) / locReviews.length).toFixed(1);
  };

  return (
    <div className="h-full w-full z-0 relative">
      <MapContainer 
        center={PENSACOLA_CENTER} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        <MapUpdater center={center} />
        
        {locations.map((loc) => {
          const rating = getAvgRating(loc.id);
          return (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]} 
              icon={festiveIcon}
              eventHandlers={{
                click: () => onSelectLocation(loc.id),
              }}
            >
              <Popup className="festive-popup">
                <div className="p-1 cursor-pointer min-w-[200px]" onClick={() => onSelectLocation(loc.id)}>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{loc.title}</h3>
                  
                  {rating && (
                    <div className="flex items-center text-amber-500 text-sm font-bold mb-2">
                       <span className="mr-1">★</span> {rating}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-600 truncate max-w-[220px] mb-2">{loc.address}</p>
                  
                  {loc.schedule && (
                    <div className="space-y-1 mb-2">
                      {loc.schedule.split('\n').filter(Boolean).slice(0, 2).map((line, idx) => (
                        <p key={idx} className="text-xs text-blue-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1 flex-shrink-0">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {line}
                        </p>
                      ))}
                      {loc.schedule.split('\n').filter(Boolean).length > 2 && (
                        <p className="text-xs text-gray-400">+ more times...</p>
                      )}
                    </div>
                  )}
                  
                  {loc.radioStation && (
                    <p className="text-xs flex items-center text-purple-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1 flex-shrink-0">
                        <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/>
                        <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/>
                        <circle cx="12" cy="9" r="2"/>
                        <path d="M16.2 4.7a6.14 6.14 0 0 1 .8 7.5"/>
                        <path d="M19.1 1.9a10.14 10.14 0 0 1 0 14.2"/>
                        <path d="M9.5 18h5"/>
                        <path d="m8 22 4-11 4 11"/>
                      </svg>
                      Tune to {loc.radioStation}
                    </p>
                  )}
                  
                  <p className="text-[10px] text-gray-400 mt-2 italic">Click for details →</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LightMap;